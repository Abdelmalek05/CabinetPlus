import "server-only";

import type { Patient } from "../../app/types";
import { getDatabase } from "./db";
import type { PatientCreateInput, PatientUpdateInput } from "./types";

type PatientRow = {
  ID: number;
  NUM_CARTE: string | null;
  NOM: string | null;
  PRENOM: string | null;
  AGE: number | null;
  AGE_MOIS: number | null;
  SEXE: string | null;
  PROFESSION: string | null;
  ETAT_FAMILIAL: string | null;
  ENFANTS: number | null;
  ADRESSE: string | null;
  TEL: string | null;
  POIDS_KG: number | null;
  TAILLE_CM: number | null;
  ANTECEDENTS_PERSONNELS: string | null;
  ANTECEDENTS_FAMILIAUX: string | null;
  NOTE: string | null;
  CREATED_AT: string | null;
  UPDATED_AT: string | null;
  LAST_CONSULTATION: string | null;
};

type PatientSearchOptions = {
  query?: string;
  familyStatus?: string;
  limit?: number;
  offset?: number;
};

type PatientListResult = {
  items: Patient[];
  total: number;
};

function normalizeGender(value: string | null): Patient["gender"] {
  const normalizedValue = value?.trim().toUpperCase();

  if (normalizedValue === "MME" || normalizedValue === "F" || normalizedValue === "FEMME") {
    return "Mme";
  }

  if (normalizedValue === "MLLE" || normalizedValue === "M'LE") {
    return "Mlle";
  }

  return "M";
}

function normalizeFamilyStatus(value: string | null) {
  const normalizedValue = value?.trim().toLowerCase();

  if (!normalizedValue) return "Célibataire";
  if (normalizedValue.includes("mari")) return "Marie(e)";
  if (normalizedValue.includes("divorc")) return "Divorcé(e)";
  if (normalizedValue.includes("veuf")) return "Veuf/Veuve";
  if (normalizedValue.includes("celib")) return "Célibataire";

  return value;
}

function mapPatientRow(row: PatientRow): Patient {
  const firstName = row.PRENOM?.trim() ?? "";
  const lastName = row.NOM?.trim() ?? "";
  const name = [firstName, lastName].filter(Boolean).join(" ").trim() || `Patient ${row.ID}`;

  return {
    id: String(row.ID),
    name,
    age: row.AGE ?? 0,
    address: row.ADRESSE ?? "",
    lastConsultation: row.LAST_CONSULTATION ?? row.CREATED_AT ?? "",
    phone: row.TEL ?? "",
    gender: normalizeGender(row.SEXE),
    profession: row.PROFESSION ?? "",
    children: row.ENFANTS ?? 0,
    familyStatus: normalizeFamilyStatus(row.ETAT_FAMILIAL) ?? "Célibataire",
    cardNumber: row.NUM_CARTE ?? undefined,
    firstName: firstName || undefined,
    lastName: lastName || undefined,
    ageMonths: row.AGE_MOIS ?? undefined,
    weightKg: row.POIDS_KG ?? undefined,
    heightCm: row.TAILLE_CM ?? undefined,
    personalHistory: row.ANTECEDENTS_PERSONNELS ?? undefined,
    familyHistory: row.ANTECEDENTS_FAMILIAUX ?? undefined,
    note: row.NOTE ?? undefined,
  };
}

function patientRowQuery() {
  return `
    SELECT
      p.ID,
      p.NUM_CARTE,
      p.NOM,
      p.PRENOM,
      p.AGE,
      p.AGE_MOIS,
      p.SEXE,
      p.PROFESSION,
      p.ETAT_FAMILIAL,
      p.ENFANTS,
      p.ADRESSE,
      p.TEL,
      p.POIDS_KG,
      p.TAILLE_CM,
      p.ANTECEDENTS_PERSONNELS,
      p.ANTECEDENTS_FAMILIAUX,
      p.NOTE,
      p.CREATED_AT,
      p.UPDATED_AT,
      (
        SELECT MAX(c.DATE)
        FROM consultation c
        WHERE c.ID_PATIENT = p.ID
      ) AS LAST_CONSULTATION
    FROM patient p
  `;
}

function buildWhereClause(options: PatientSearchOptions) {
  const clauses: string[] = [];
  const params: Array<string | number> = [];
  const query = options.query?.trim();
  const familyStatus = options.familyStatus?.trim();

  if (query) {
    const likeQuery = `%${query}%`;
    clauses.push(`(
      p.NOM LIKE ?
      OR p.PRENOM LIKE ?
      OR p.ADRESSE LIKE ?
      OR p.TEL LIKE ?
      OR p.NUM_CARTE LIKE ?
    )`);
    params.push(likeQuery, likeQuery, likeQuery, likeQuery, likeQuery);
  }

  if (familyStatus && familyStatus !== "Tous") {
    clauses.push("COALESCE(p.ETAT_FAMILIAL, '') = ?");
    params.push(familyStatus);
  }

  return {
    sql: clauses.length ? `WHERE ${clauses.join(" AND ")}` : "",
    params,
  };
}

export function listPatients(options: PatientSearchOptions = {}): PatientListResult {
  const database = getDatabase();
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;
  const { sql, params } = buildWhereClause(options);

  const items = database
    .prepare(
      `
        ${patientRowQuery()}
        ${sql}
        ORDER BY p.ID DESC
        LIMIT ? OFFSET ?
      `,
    )
    .all(...params, limit, offset) as PatientRow[];

  const total = database
    .prepare(
      `
        SELECT COUNT(*) AS total
        FROM patient p
        ${sql}
      `,
    )
    .get(...params) as { total: number } | undefined;

  return {
    items: items.map(mapPatientRow),
    total: total?.total ?? 0,
  };
}

export function getRecentPatients(limit = 10): Patient[] {
  return listPatients({ limit }).items;
}

export function getPatientById(id: string | number): Patient | null {
  const database = getDatabase();
  const row = database
    .prepare(
      `
        ${patientRowQuery()}
        WHERE p.ID = ?
        LIMIT 1
      `,
    )
    .get(Number(id)) as PatientRow | undefined;

  return row ? mapPatientRow(row) : null;
}

export function searchPatients(query: string, limit = 20): Patient[] {
  return listPatients({ query, limit }).items;
}

export function createPatient(input: PatientCreateInput): Patient {
  const database = getDatabase();
  const statement = database.prepare(
    `
      INSERT INTO patient (
        NUM_CARTE,
        NOM,
        PRENOM,
        AGE,
        AGE_MOIS,
        SEXE,
        PROFESSION,
        ETAT_FAMILIAL,
        ENFANTS,
        ADRESSE,
        TEL,
        POIDS_KG,
        TAILLE_CM,
        ANTECEDENTS_PERSONNELS,
        ANTECEDENTS_FAMILIAUX,
        NOTE,
        CREATED_AT,
        UPDATED_AT
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `,
  );

  const result = statement.run(
    input.cardNumber?.trim() || null,
    input.lastName.trim(),
    input.firstName.trim(),
    input.age,
    input.ageMonths ?? 0,
    input.gender,
    input.profession?.trim() || null,
    normalizeFamilyStatus(input.familyStatus ?? null),
    input.children ?? 0,
    input.address?.trim() || null,
    input.phone?.trim() || null,
    input.weightKg ?? null,
    input.heightCm ?? null,
    input.personalHistory?.trim() || null,
    input.familyHistory?.trim() || null,
    input.note?.trim() || null,
  );

  const patient = getPatientById(result.lastInsertRowid as number);

  if (!patient) {
    throw new Error("Patient creation failed.");
  }

  return patient;
}

export function updatePatient(id: string | number, input: PatientUpdateInput): Patient | null {
  const existingPatient = getPatientById(id);

  if (!existingPatient) {
    return null;
  }

  const merged = {
    cardNumber: input.cardNumber ?? existingPatient.cardNumber ?? "",
    firstName: input.firstName ?? existingPatient.firstName ?? "",
    lastName: input.lastName ?? existingPatient.lastName ?? "",
    age: input.age ?? existingPatient.age,
    ageMonths: input.ageMonths ?? existingPatient.ageMonths ?? 0,
    gender: input.gender ?? existingPatient.gender,
    profession: input.profession ?? existingPatient.profession,
    familyStatus: input.familyStatus ?? existingPatient.familyStatus,
    children: input.children ?? existingPatient.children,
    address: input.address ?? existingPatient.address,
    phone: input.phone ?? existingPatient.phone,
    weightKg: input.weightKg ?? existingPatient.weightKg ?? 0,
    heightCm: input.heightCm ?? existingPatient.heightCm ?? 0,
    personalHistory: input.personalHistory ?? existingPatient.personalHistory ?? "",
    familyHistory: input.familyHistory ?? existingPatient.familyHistory ?? "",
    note: input.note ?? existingPatient.note ?? "",
  } satisfies Required<PatientCreateInput>;

  const database = getDatabase();
  database
    .prepare(
      `
        UPDATE patient
        SET
          NUM_CARTE = ?,
          NOM = ?,
          PRENOM = ?,
          AGE = ?,
          AGE_MOIS = ?,
          SEXE = ?,
          PROFESSION = ?,
          ETAT_FAMILIAL = ?,
          ENFANTS = ?,
          ADRESSE = ?,
          TEL = ?,
          POIDS_KG = ?,
          TAILLE_CM = ?,
          ANTECEDENTS_PERSONNELS = ?,
          ANTECEDENTS_FAMILIAUX = ?,
          NOTE = ?,
          UPDATED_AT = datetime('now')
        WHERE ID = ?
      `,
    )
    .run(
      merged.cardNumber?.trim() || null,
      merged.lastName.trim(),
      merged.firstName.trim(),
      merged.age,
      merged.ageMonths,
      merged.gender,
      merged.profession?.trim() || null,
      normalizeFamilyStatus(merged.familyStatus ?? null),
      merged.children,
      merged.address?.trim() || null,
      merged.phone?.trim() || null,
      merged.weightKg,
      merged.heightCm,
      merged.personalHistory?.trim() || null,
      merged.familyHistory?.trim() || null,
      merged.note?.trim() || null,
      Number(id),
    );

  return getPatientById(id);
}

export function deletePatient(id: string | number): boolean {
  const result = getDatabase().prepare("DELETE FROM patient WHERE ID = ?").run(Number(id));
  return result.changes > 0;
}

export function countPatients() {
  const row = getDatabase().prepare("SELECT COUNT(*) AS total FROM patient").get() as { total: number } | undefined;
  return row?.total ?? 0;
}