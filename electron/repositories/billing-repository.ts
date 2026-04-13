import "server-only";

import { getDatabase } from "./db";
import type { RevenueRow } from "./types";

type BillingRow = {
  consultationId: number;
  patientId: number;
  patientName: string;
  address: string;
  date: string;
  amount: number;
};

export function listRevenueRows(startDate: string, endDate: string): RevenueRow[] {
  const rows = getDatabase()
    .prepare(
      `
        SELECT
          c.ID AS consultationId,
          c.ID_PATIENT AS patientId,
          TRIM(COALESCE(p.PRENOM, '') || ' ' || COALESCE(p.NOM, '')) AS patientName,
          COALESCE(p.ADRESSE, '') AS address,
          COALESCE(c.DATE, '') AS date,
          COALESCE(c.TARIF, 0) AS amount
        FROM consultation c
        LEFT JOIN patient p ON p.ID = c.ID_PATIENT
        WHERE c.DATE BETWEEN ? AND ?
        ORDER BY c.DATE ASC, c.ID DESC
      `,
    )
    .all(startDate, endDate) as BillingRow[];

  return rows.map((row) => ({
    consultationId: String(row.consultationId),
    patientId: String(row.patientId),
    patientName: row.patientName.trim() || `Patient ${row.patientId}`,
    address: row.address,
    date: row.date,
    amount: row.amount,
  }));
}

export function getRevenueTotal(startDate: string, endDate: string) {
  const row = getDatabase()
    .prepare(
      `
        SELECT COALESCE(SUM(COALESCE(TARIF, 0)), 0) AS total
        FROM consultation
        WHERE DATE BETWEEN ? AND ?
      `,
    )
    .get(startDate, endDate) as { total: number } | undefined;

  return row?.total ?? 0;
}