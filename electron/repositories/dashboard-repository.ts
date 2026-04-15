import { countAppointmentsByDate } from "./appointment-repository.ts"
import { getRevenueTotal } from "./billing-repository.ts"
import { countPatients } from "./patient-repository.ts"

export function getDashboardSummary(referenceDate = new Date().toISOString().slice(0, 10)) {
  return {
    patientCount: countPatients(),
    appointmentCount: countAppointmentsByDate(referenceDate),
    revenueTotal: getRevenueTotal(referenceDate.slice(0, 7) + "-01", referenceDate),
  };
}