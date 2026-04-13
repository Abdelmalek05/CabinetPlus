import "server-only";

import type { Appointment } from "../../app/types";
import { getDatabase } from "./db";
import type { AppointmentCreateInput } from "./types";

type AppointmentRow = {
  ID: number;
  ID_PATIENT: number;
  DATE: string;
  CONSULT: number | null;
  ETAT: number | null;
  PATIENT_NAME: string | null;
};

type AppointmentListOptions = {
  date?: string;
  patientId?: string | number;
  limit?: number;
};

function mapAppointmentRow(row: AppointmentRow): Appointment {
  return {
    id: String(row.ID),
    patientName: row.PATIENT_NAME ?? `Patient ${row.ID_PATIENT}`,
    type: row.CONSULT ? "Consultation" : "Rendez-vous",
    time: "09:00",
    date: row.DATE,
    status: row.ETAT === 1 ? "urgent" : "normal",
  };
}

function appointmentRowQuery() {
  return `
    SELECT
      r.ID,
      r.ID_PATIENT,
      r.DATE,
      r.CONSULT,
      r.ETAT,
      COALESCE(
        NULLIF(TRIM(COALESCE(p.PRENOM, '') || ' ' || COALESCE(p.NOM, '')), ''),
        NULLIF(TRIM(COALESCE(p.NOM, '') || ' ' || COALESCE(p.PRENOM, '')), ''),
        NULL
      ) AS PATIENT_NAME
    FROM rdv r
    LEFT JOIN patient p ON p.ID = r.ID_PATIENT
  `;
}

export function listAppointments(options: AppointmentListOptions = {}): Appointment[] {
  const clauses: string[] = [];
  const params: Array<string | number> = [];

  if (options.date) {
    clauses.push("r.DATE = ?");
    params.push(options.date);
  }

  if (options.patientId) {
    clauses.push("r.ID_PATIENT = ?");
    params.push(Number(options.patientId));
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const limit = options.limit ?? 50;
  const rows = getDatabase()
    .prepare(
      `
        ${appointmentRowQuery()}
        ${whereClause}
        ORDER BY r.DATE ASC, r.ID DESC
        LIMIT ?
      `,
    )
    .all(...params, limit) as AppointmentRow[];

  return rows.map(mapAppointmentRow);
}

export function getAppointmentById(id: string | number): Appointment | null {
  const row = getDatabase()
    .prepare(
      `
        ${appointmentRowQuery()}
        WHERE r.ID = ?
        LIMIT 1
      `,
    )
    .get(Number(id)) as AppointmentRow | undefined;

  return row ? mapAppointmentRow(row) : null;
}

export function createAppointment(input: AppointmentCreateInput): Appointment {
  const database = getDatabase();
  const result = database
    .prepare("INSERT INTO rdv (ID_PATIENT, DATE, CONSULT, ETAT) VALUES (?, ?, ?, ?)")
    .run(Number(input.patientId), input.date, input.consultId ? Number(input.consultId) : null, input.state ?? 0);

  const appointment = getAppointmentById(result.lastInsertRowid as number);

  if (!appointment) {
    throw new Error("Appointment creation failed.");
  }

  return appointment;
}

export function updateAppointment(id: string | number, input: Partial<AppointmentCreateInput>): Appointment | null {
  const existing = getAppointmentById(id);

  if (!existing) {
    return null;
  }

  const current = getDatabase().prepare("SELECT ID_PATIENT, DATE, CONSULT, ETAT FROM rdv WHERE ID = ? LIMIT 1").get(Number(id)) as
    | { ID_PATIENT: number; DATE: string; CONSULT: number | null; ETAT: number | null }
    | undefined;

  if (!current) {
    return null;
  }

  getDatabase()
    .prepare("UPDATE rdv SET ID_PATIENT = ?, DATE = ?, CONSULT = ?, ETAT = ? WHERE ID = ?")
    .run(
      input.patientId ? Number(input.patientId) : current.ID_PATIENT,
      input.date ?? current.DATE,
      input.consultId !== undefined ? (input.consultId === null ? null : Number(input.consultId)) : current.CONSULT,
      input.state ?? current.ETAT,
      Number(id),
    );

  return getAppointmentById(id);
}

export function deleteAppointment(id: string | number): boolean {
  const result = getDatabase().prepare("DELETE FROM rdv WHERE ID = ?").run(Number(id));
  return result.changes > 0;
}

export function countAppointmentsByDate(date: string) {
  const row = getDatabase().prepare("SELECT COUNT(*) AS total FROM rdv WHERE DATE = ?").get(date) as { total: number } | undefined;
  return row?.total ?? 0;
}

export function getUpcomingAppointments(limit = 10): Appointment[] {
  return listAppointments({ limit });
}