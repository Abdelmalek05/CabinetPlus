import "server-only";

import { getDatabase } from "./db";
import type { ArretMaladieCreateInput, DocumentQueryOptions } from "./types";

type ArretMaladieRow = {
  ID: number;
  TEXT: string;
  DATEDEBUT: string;
  DATEFIN: string;
  ID_PATIENT: number;
  ID_CONSULT: number;
};

export type ArretMaladieRecord = {
  id: string;
  text: string;
  dateDebut: string;
  dateFin: string;
  patientId: string;
  consultationId: string;
};

function mapRow(row: ArretMaladieRow): ArretMaladieRecord {
  return {
    id: String(row.ID),
    text: row.TEXT,
    dateDebut: row.DATEDEBUT,
    dateFin: row.DATEFIN,
    patientId: String(row.ID_PATIENT),
    consultationId: String(row.ID_CONSULT),
  };
}

export function listArretMaladies(options: DocumentQueryOptions = {}) {
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
        FROM arretmaladie
        ${whereClause}
        ORDER BY ID DESC
        LIMIT ? OFFSET ?
      `,
    )
    .all(...params, limit, offset) as ArretMaladieRow[];

  return rows.map(mapRow);
}

export function getArretMaladieById(id: string | number) {
  const row = getDatabase()
    .prepare(
      `
        SELECT ID, TEXT, DATEDEBUT, DATEFIN, ID_PATIENT, ID_CONSULT
        FROM arretmaladie
        WHERE ID = ?
        LIMIT 1
      `,
    )
    .get(Number(id)) as ArretMaladieRow | undefined;

  return row ? mapRow(row) : null;
}

export function createArretMaladie(input: ArretMaladieCreateInput) {
  const result = getDatabase()
    .prepare("INSERT INTO arretmaladie (TEXT, DATEDEBUT, DATEFIN, ID_PATIENT, ID_CONSULT) VALUES (?, ?, ?, ?, ?)")
    .run(input.text, input.dateDebut, input.dateFin, Number(input.patientId), Number(input.consultationId));

  return getArretMaladieById(result.lastInsertRowid as number);
}

export function updateArretMaladie(id: string | number, input: Partial<ArretMaladieCreateInput>) {
  const existing = getArretMaladieById(id);

  if (!existing) return null;

  getDatabase()
    .prepare("UPDATE arretmaladie SET TEXT = ?, DATEDEBUT = ?, DATEFIN = ?, ID_PATIENT = ?, ID_CONSULT = ? WHERE ID = ?")
    .run(
      input.text ?? existing.text,
      input.dateDebut ?? existing.dateDebut,
      input.dateFin ?? existing.dateFin,
      input.patientId !== undefined ? Number(input.patientId) : Number(existing.patientId),
      input.consultationId !== undefined ? Number(input.consultationId) : Number(existing.consultationId),
      Number(id),
    );

  return getArretMaladieById(id);
}

export function deleteArretMaladie(id: string | number) {
  const result = getDatabase().prepare("DELETE FROM arretmaladie WHERE ID = ?").run(Number(id));
  return result.changes > 0;
}