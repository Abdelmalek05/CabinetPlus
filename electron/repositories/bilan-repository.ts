import "server-only";

import { getDatabase } from "./db";
import type { BilanCreateInput, DocumentQueryOptions } from "./types";

type BilanRow = {
  ID: number;
  AVANT: string;
  BILAN: string;
  SALUT: string;
  ID_PATIENT: number;
  ID_CONSULT: number;
};

export type BilanRecord = {
  id: string;
  avant: string;
  bilan: string;
  salut: string;
  patientId: string;
  consultationId: string;
};

function mapRow(row: BilanRow): BilanRecord {
  return {
    id: String(row.ID),
    avant: row.AVANT,
    bilan: row.BILAN,
    salut: row.SALUT,
    patientId: String(row.ID_PATIENT),
    consultationId: String(row.ID_CONSULT),
  };
}

export function listBilans(options: DocumentQueryOptions = {}) {
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
        SELECT ID, AVANT, BILAN, SALUT, ID_PATIENT, ID_CONSULT
        FROM bilan
        ${whereClause}
        ORDER BY ID DESC
        LIMIT ? OFFSET ?
      `,
    )
    .all(...params, limit, offset) as BilanRow[];

  return rows.map(mapRow);
}

export function getBilanById(id: string | number) {
  const row = getDatabase()
    .prepare(
      `
        SELECT ID, AVANT, BILAN, SALUT, ID_PATIENT, ID_CONSULT
        FROM bilan
        WHERE ID = ?
        LIMIT 1
      `,
    )
    .get(Number(id)) as BilanRow | undefined;

  return row ? mapRow(row) : null;
}

export function createBilan(input: BilanCreateInput) {
  const result = getDatabase()
    .prepare("INSERT INTO bilan (AVANT, BILAN, SALUT, ID_PATIENT, ID_CONSULT) VALUES (?, ?, ?, ?, ?)")
    .run(input.avant, input.bilan, input.salut, Number(input.patientId), Number(input.consultationId));

  return getBilanById(result.lastInsertRowid as number);
}

export function updateBilan(id: string | number, input: Partial<BilanCreateInput>) {
  const existing = getBilanById(id);

  if (!existing) return null;

  getDatabase()
    .prepare("UPDATE bilan SET AVANT = ?, BILAN = ?, SALUT = ?, ID_PATIENT = ?, ID_CONSULT = ? WHERE ID = ?")
    .run(
      input.avant ?? existing.avant,
      input.bilan ?? existing.bilan,
      input.salut ?? existing.salut,
      input.patientId !== undefined ? Number(input.patientId) : Number(existing.patientId),
      input.consultationId !== undefined ? Number(input.consultationId) : Number(existing.consultationId),
      Number(id),
    );

  return getBilanById(id);
}

export function deleteBilan(id: string | number) {
  const result = getDatabase().prepare("DELETE FROM bilan WHERE ID = ?").run(Number(id));
  return result.changes > 0;
}