import "server-only";

import { getDatabase } from "./db";
import type { ArretTravailCreateInput, DocumentQueryOptions } from "./types";

type ArretTravailRow = {
  ID: number;
  TEXT: string;
  DATEDEBUT: string;
  DATEFIN: string;
  ID_PATIENT: number;
  ID_CONSULT: number;
};

export type ArretTravailRecord = {
  id: string;
  text: string;
  dateDebut: string;
  dateFin: string;
  patientId: string;
  consultationId: string;
};

function mapRow(row: ArretTravailRow): ArretTravailRecord {
  return {
    id: String(row.ID),
    text: row.TEXT,
    dateDebut: row.DATEDEBUT,
    dateFin: row.DATEFIN,
    patientId: String(row.ID_PATIENT),
    consultationId: String(row.ID_CONSULT),
  };
}

export function listArretTravails(options: DocumentQueryOptions = {}) {
  const clauses: string[] = [];
  const params: Array<string | number> = [];

  if (options.patientId !== undefined) {
    clauses.push("ID_PATIENT = ?");
    params.push(Number(options.patientId));
  }

  if (options.consultationId !== undefined) {
    clauses.push("ID_CONSULT = ?");
    params.push(Number(options.consultationId));
  }

  const whereClause = clauses.length ? `WHERE ${clauses.join(" AND ")}` : "";
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;

  const rows = getDatabase()
    .prepare(
      `
        SELECT ID, TEXT, DATEDEBUT, DATEFIN, ID_PATIENT, ID_CONSULT
        FROM arretravail
        ${whereClause}
        ORDER BY ID DESC
        LIMIT ? OFFSET ?
      `,
    )
    .all(...params, limit, offset) as ArretTravailRow[];

  return rows.map(mapRow);
}

export function getArretTravailById(id: string | number) {
  const row = getDatabase()
    .prepare(
      `
        SELECT ID, TEXT, DATEDEBUT, DATEFIN, ID_PATIENT, ID_CONSULT
        FROM arretravail
        WHERE ID = ?
        LIMIT 1
      `,
    )
    .get(Number(id)) as ArretTravailRow | undefined;

  return row ? mapRow(row) : null;
}

export function createArretTravail(input: ArretTravailCreateInput) {
  const result = getDatabase()
    .prepare("INSERT INTO arretravail (TEXT, DATEDEBUT, DATEFIN, ID_PATIENT, ID_CONSULT) VALUES (?, ?, ?, ?, ?)")
    .run(input.text, input.dateDebut, input.dateFin, Number(input.patientId), Number(input.consultationId));

  return getArretTravailById(result.lastInsertRowid as number);
}

export function updateArretTravail(id: string | number, input: Partial<ArretTravailCreateInput>) {
  const existing = getArretTravailById(id);

  if (!existing) return null;

  getDatabase()
    .prepare("UPDATE arretravail SET TEXT = ?, DATEDEBUT = ?, DATEFIN = ?, ID_PATIENT = ?, ID_CONSULT = ? WHERE ID = ?")
    .run(
      input.text ?? existing.text,
      input.dateDebut ?? existing.dateDebut,
      input.dateFin ?? existing.dateFin,
      input.patientId !== undefined ? Number(input.patientId) : Number(existing.patientId),
      input.consultationId !== undefined ? Number(input.consultationId) : Number(existing.consultationId),
      Number(id),
    );

  return getArretTravailById(id);
}

export function deleteArretTravail(id: string | number) {
  const result = getDatabase().prepare("DELETE FROM arretravail WHERE ID = ?").run(Number(id));
  return result.changes > 0;
}