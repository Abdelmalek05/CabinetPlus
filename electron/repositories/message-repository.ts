import "server-only";

import { getDatabase } from "./db";
import type { MessageCreateInput, MessageUpdateInput } from "./types";

type MessageRow = {
  ID: number;
  NOM: string;
  EMAIL: string;
  TEL: string;
  MESSAGE: string;
  MEDECIN: string;
};

export type MessageRecord = {
  id: string;
  nom: string;
  email: string;
  tel: string;
  message: string;
  medecin: string;
};

function mapRow(row: MessageRow): MessageRecord {
  return {
    id: String(row.ID),
    nom: row.NOM,
    email: row.EMAIL,
    tel: row.TEL,
    message: row.MESSAGE,
    medecin: row.MEDECIN,
  };
}

export function listMessages(limit = 50, offset = 0) {
  const rows = getDatabase()
    .prepare(
      `
        SELECT ID, NOM, EMAIL, TEL, MESSAGE, MEDECIN
        FROM message
        ORDER BY ID DESC
        LIMIT ? OFFSET ?
      `,
    )
    .all(limit, offset) as MessageRow[];

  return rows.map(mapRow);
}

export function getMessageById(id: string | number) {
  const row = getDatabase()
    .prepare(
      `
        SELECT ID, NOM, EMAIL, TEL, MESSAGE, MEDECIN
        FROM message
        WHERE ID = ?
        LIMIT 1
      `,
    )
    .get(Number(id)) as MessageRow | undefined;

  return row ? mapRow(row) : null;
}

export function createMessage(input: MessageCreateInput) {
  const result = getDatabase()
    .prepare("INSERT INTO message (NOM, EMAIL, TEL, MESSAGE, MEDECIN) VALUES (?, ?, ?, ?, ?)")
    .run(input.nom, input.email, input.tel, input.message, input.medecin);

  return getMessageById(result.lastInsertRowid as number);
}

export function updateMessage(id: string | number, input: MessageUpdateInput) {
  const existing = getMessageById(id);

  if (!existing) return null;

  getDatabase()
    .prepare("UPDATE message SET NOM = ?, EMAIL = ?, TEL = ?, MESSAGE = ?, MEDECIN = ? WHERE ID = ?")
    .run(
      input.nom ?? existing.nom,
      input.email ?? existing.email,
      input.tel ?? existing.tel,
      input.message ?? existing.message,
      input.medecin ?? existing.medecin,
      Number(id),
    );

  return getMessageById(id);
}

export function deleteMessage(id: string | number) {
  const result = getDatabase().prepare("DELETE FROM message WHERE ID = ?").run(Number(id));
  return result.changes > 0;
}