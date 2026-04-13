import "server-only";

import { getDatabase } from "./db";
import type { ConsultationCreateInput, PrescriptionCreateInput } from "./types";

type ConsultationRow = {
  ID: number;
  CONSTAT: string | null;
  DIAGNOSTIC: string | null;
  EXPLORATION: string | null;
  MALADIE: string | null;
  TRAITEMENT: string | null;
  NOTE: string | null;
  DATE: string | null;
  HEURE: string | null;
  TARIF: number | null;
  ID_PATIENT: number;
};

type PrescriptionRow = {
  ID: number;
  MEDICAMENT: string;
  TYPE: string;
  PRISE: string;
  DUREE: string;
  ID_PATIENT: number;
  ID_CONSULT: number;
};

function formatTime(time?: string) {
  if (!time) return new Date().toTimeString().slice(0, 8);
  if (/^\d{2}:\d{2}$/.test(time)) return `${time}:00`;
  return time;
}

export function listConsultationsByPatient(patientId: string | number) {
  const rows = getDatabase()
    .prepare(
      `
        SELECT ID, CONSTAT, DIAGNOSTIC, EXPLORATION, MALADIE, TRAITEMENT, NOTE, DATE, HEURE, TARIF, ID_PATIENT
        FROM consultation
        WHERE ID_PATIENT = ?
        ORDER BY DATE DESC, ID DESC
      `,
    )
    .all(Number(patientId)) as ConsultationRow[];

  return rows;
}

export function getConsultationById(id: string | number) {
  return getDatabase()
    .prepare(
      `
        SELECT ID, CONSTAT, DIAGNOSTIC, EXPLORATION, MALADIE, TRAITEMENT, NOTE, DATE, HEURE, TARIF, ID_PATIENT
        FROM consultation
        WHERE ID = ?
        LIMIT 1
      `,
    )
    .get(Number(id)) as ConsultationRow | undefined;
}

export function createConsultation(input: ConsultationCreateInput) {
  const result = getDatabase()
    .prepare(
      `
        INSERT INTO consultation (
          CONSTAT,
          DIAGNOSTIC,
          EXPLORATION,
          MALADIE,
          TRAITEMENT,
          NOTE,
          DATE,
          HEURE,
          TARIF,
          ID_PATIENT
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      input.constat ?? null,
      input.diagnostic ?? null,
      input.exploration ?? null,
      input.maladie ?? null,
      input.traitement ?? null,
      input.note ?? null,
      input.date,
      formatTime(input.time),
      input.tarif ?? null,
      Number(input.patientId),
    );

  return getConsultationById(result.lastInsertRowid as number);
}

export function deleteConsultation(id: string | number): boolean {
  const result = getDatabase().prepare("DELETE FROM consultation WHERE ID = ?").run(Number(id));
  return result.changes > 0;
}

export function listPrescriptionsByConsultation(consultationId: string | number) {
  return getDatabase()
    .prepare(
      `
        SELECT ID, MEDICAMENT, TYPE, PRISE, DUREE, ID_PATIENT, ID_CONSULT
        FROM ordonnance
        WHERE ID_CONSULT = ?
        ORDER BY ID ASC
      `,
    )
    .all(Number(consultationId)) as PrescriptionRow[];
}

export function addPrescription(input: PrescriptionCreateInput) {
  const result = getDatabase()
    .prepare(
      `
        INSERT INTO ordonnance (MEDICAMENT, TYPE, PRISE, DUREE, ID_PATIENT, ID_CONSULT)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      input.medicament,
      input.type,
      input.prise,
      input.duree,
      Number(input.patientId),
      Number(input.consultationId),
    );

  return result.lastInsertRowid;
}

export function deletePrescription(id: string | number): boolean {
  const result = getDatabase().prepare("DELETE FROM ordonnance WHERE ID = ?").run(Number(id));
  return result.changes > 0;
}