import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

type PatientCandidateRow = {
  ID: number;
  NOM: string | null;
  PRENOM: string | null;
  AGE: number | null;
  SEXE: string | null;
};

type PatientRow = {
  ID: number;
  AGE: number | null;
  AGE_MOIS: number | null;
  SEXE: string | null;
  PROFESSION: string | null;
  POIDS_KG: number | null;
  TAILLE_CM: number | null;
  ANTECEDENTS_PERSONNELS: string | null;
  ANTECEDENTS_FAMILIAUX: string | null;
  NOTE: string | null;
};

type ConsultationRow = {
  ID: number;
  DATE: string | null;
  DIAGNOSTIC: string | null;
  MALADIE: string | null;
  EXPLORATION: string | null;
  TRAITEMENT: string | null;
  CONSTAT: string | null;
  NOTE: string | null;
};

type PrescriptionRow = {
  ID_CONSULT: number;
  MEDICAMENT: string;
  TYPE: string;
  PRISE: string;
  DUREE: string;
};

type BilanRow = {
  ID_CONSULT: number;
  AVANT: string;
  BILAN: string;
  SALUT: string;
};

export type PatientContextCandidate = {
  id: string;
  label: string;
};

const DATABASE_PATH = path.join(process.cwd(), "electron", "db", "cabinetplus.db");

function normalizeText(value: string | null | undefined, maxLength = 280) {
  if (!value) return "";
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return "";
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
}

function normalizeSex(value: string | null | undefined) {
  const normalized = value?.trim().toUpperCase();
  if (!normalized) return "Non precise";
  if (normalized === "M" || normalized === "H" || normalized === "HOMME") return "Homme";
  if (normalized === "F" || normalized === "FEMME" || normalized === "MME") return "Femme";
  if (normalized === "MLLE") return "Femme";
  return value?.trim() || "Non precise";
}

function formatPatientName(row: { ID: number; PRENOM: string | null; NOM: string | null }) {
  const firstName = normalizeText(row.PRENOM, 60);
  const lastName = normalizeText(row.NOM, 60);
  return [firstName, lastName].filter(Boolean).join(" ").trim() || `Patient ${row.ID}`;
}

function withDatabase<T>(operation: (database: Database) => T): T | null {
  if (!fs.existsSync(DATABASE_PATH)) {
    return null;
  }

  const database = new Database(DATABASE_PATH);

  try {
    return operation(database);
  } catch (error) {
    console.error("Patient context database query failed:", error);
    return null;
  } finally {
    database.close();
  }
}

function appendIfPresent(lines: string[], label: string, value: string | null | undefined, maxLength = 260) {
  const text = normalizeText(value, maxLength);
  if (text) {
    lines.push(`- ${label}: ${text}`);
  }
}

export function listPatientContextCandidates(limit = 120): PatientContextCandidate[] {
  const rows = withDatabase((database) =>
    database
      .prepare<PatientCandidateRow>(
        `
          SELECT ID, NOM, PRENOM, AGE, SEXE
          FROM patient
          ORDER BY ID DESC
          LIMIT ?
        `,
      )
      .all(limit),
  );

  if (!rows?.length) {
    return [];
  }

  return rows.map((row) => {
    const displayName = formatPatientName(row);
    const agePart = row.AGE && row.AGE > 0 ? `${row.AGE} ans` : "Age non precise";
    const sexPart = normalizeSex(row.SEXE);
    return {
      id: String(row.ID),
      label: `${displayName} - ${agePart} - ${sexPart}`,
    };
  });
}

export function buildPatientClinicalContext(patientId: string | number) {
  const numericPatientId = Number(patientId);

  if (!Number.isFinite(numericPatientId) || numericPatientId <= 0) {
    return null;
  }

  return withDatabase((database) => {
    const patient = database
      .prepare<PatientRow>(
        `
          SELECT ID, AGE, AGE_MOIS, SEXE, PROFESSION, POIDS_KG, TAILLE_CM,
                 ANTECEDENTS_PERSONNELS, ANTECEDENTS_FAMILIAUX, NOTE
          FROM patient
          WHERE ID = ?
          LIMIT 1
        `,
      )
      .get(numericPatientId);

    if (!patient) {
      return null;
    }

    const consultations = database
      .prepare<ConsultationRow>(
        `
          SELECT ID, DATE, DIAGNOSTIC, MALADIE, EXPLORATION, TRAITEMENT, CONSTAT, NOTE
          FROM consultation
          WHERE ID_PATIENT = ?
          ORDER BY DATE DESC, ID DESC
          LIMIT 3
        `,
      )
      .all(numericPatientId);

    const consultationIds = consultations.map((consultation) => consultation.ID);

    const prescriptions = consultationIds.length
      ? database
          .prepare<PrescriptionRow>(
            `
              SELECT ID_CONSULT, MEDICAMENT, TYPE, PRISE, DUREE
              FROM ordonnance
              WHERE ID_PATIENT = ?
                AND ID_CONSULT IN (${consultationIds.map(() => "?").join(",")})
              ORDER BY ID DESC
              LIMIT 10
            `,
          )
          .all(numericPatientId, ...consultationIds)
      : [];

    const bilans = consultationIds.length
      ? database
          .prepare<BilanRow>(
            `
              SELECT ID_CONSULT, AVANT, BILAN, SALUT
              FROM bilan
              WHERE ID_PATIENT = ?
                AND ID_CONSULT IN (${consultationIds.map(() => "?").join(",")})
              ORDER BY ID DESC
              LIMIT 3
            `,
          )
          .all(numericPatientId, ...consultationIds)
      : [];

    const lines: string[] = [];
    lines.push("## Contexte clinique patient (anonymise)");
    lines.push("- Utiliser ce contexte uniquement pour le raisonnement clinique de la reponse en cours.");

    const demographicParts: string[] = [];
    if (patient.AGE && patient.AGE > 0) demographicParts.push(`${patient.AGE} ans`);
    if (patient.AGE_MOIS && patient.AGE_MOIS > 0) demographicParts.push(`${patient.AGE_MOIS} mois`);
    demographicParts.push(normalizeSex(patient.SEXE));

    lines.push(`- Profil: ${demographicParts.filter(Boolean).join(" - ")}`);
    appendIfPresent(lines, "Profession", patient.PROFESSION, 80);

    if (patient.POIDS_KG || patient.TAILLE_CM) {
      const weight = patient.POIDS_KG ? `${patient.POIDS_KG} kg` : "poids non precise";
      const height = patient.TAILLE_CM ? `${patient.TAILLE_CM} cm` : "taille non precise";
      lines.push(`- Anthropometrie: ${weight}, ${height}`);
    }

    appendIfPresent(lines, "Antecedents personnels", patient.ANTECEDENTS_PERSONNELS, 360);
    appendIfPresent(lines, "Antecedents familiaux", patient.ANTECEDENTS_FAMILIAUX, 320);
    appendIfPresent(lines, "Notes cliniques", patient.NOTE, 320);

    if (consultations.length) {
      lines.push("### Consultations recentes");
      consultations.forEach((consultation, index) => {
        const consultationLabel = consultation.DATE ? `${consultation.DATE}` : `Consultation ${index + 1}`;
        const entry: string[] = [];
        entry.push(`- ${consultationLabel}`);

        const details: string[] = [];
        const diagnostic = normalizeText(consultation.DIAGNOSTIC, 240);
        const disease = normalizeText(consultation.MALADIE, 180);
        const findings = normalizeText(consultation.CONSTAT, 180);
        const exploration = normalizeText(consultation.EXPLORATION, 180);
        const treatment = normalizeText(consultation.TRAITEMENT, 180);
        const note = normalizeText(consultation.NOTE, 180);

        if (diagnostic) details.push(`diagnostic: ${diagnostic}`);
        if (disease) details.push(`pathologie evoquee: ${disease}`);
        if (findings) details.push(`constat clinique: ${findings}`);
        if (exploration) details.push(`explorations: ${exploration}`);
        if (treatment) details.push(`traitement: ${treatment}`);
        if (note) details.push(`note: ${note}`);

        if (details.length) {
          entry.push(`  - ${details.join(" | ")}`);
        }

        lines.push(...entry);
      });
    }

    if (prescriptions.length) {
      lines.push("### Prescriptions recentes");
      prescriptions.slice(0, 6).forEach((prescription) => {
        const medication = normalizeText(prescription.MEDICAMENT, 80);
        if (!medication) return;
        const type = normalizeText(prescription.TYPE, 60);
        const dosage = normalizeText(prescription.PRISE, 120);
        const duration = normalizeText(prescription.DUREE, 60);
        const chunks = [type, dosage, duration].filter(Boolean).join(" | ");
        lines.push(`- ${medication}${chunks ? ` - ${chunks}` : ""}`);
      });
    }

    if (bilans.length) {
      lines.push("### Bilans associes");
      bilans.slice(0, 3).forEach((bilan) => {
        const before = normalizeText(bilan.AVANT, 120);
        const result = normalizeText(bilan.BILAN, 180);
        const followUp = normalizeText(bilan.SALUT, 120);
        const parts = [before ? `avant: ${before}` : "", result ? `bilan: ${result}` : "", followUp ? `suite: ${followUp}` : ""].filter(Boolean);
        if (parts.length) {
          lines.push(`- ${parts.join(" | ")}`);
        }
      });
    }

    const context = lines.join("\n");
    return context.length > 4500 ? `${context.slice(0, 4500)}\n- ... (contexte tronque)` : context;
  });
}
