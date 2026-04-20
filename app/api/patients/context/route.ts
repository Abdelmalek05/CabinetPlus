import { MOCK_PATIENTS } from "@/app/constants";
import { listPatientContextCandidates } from "@/app/lib/server/patient-context";

export const runtime = "nodejs";

export async function GET() {
  const patients = listPatientContextCandidates();

  if (patients.length > 0) {
    return Response.json({ patients });
  }

  const fallbackPatients = MOCK_PATIENTS.slice(0, 80).map((patient) => ({
    id: patient.id,
    label: `${patient.name} - ${patient.age} ans - ${patient.gender}`,
  }));

  return Response.json({ patients: fallbackPatients });
}
