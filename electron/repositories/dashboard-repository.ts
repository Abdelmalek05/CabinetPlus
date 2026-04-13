import "server-only";

import { countAppointmentsByDate } from "./appointment-repository";
import { getRevenueTotal } from "./billing-repository";
import { countPatients } from "./patient-repository";

export function getDashboardSummary(referenceDate = new Date().toISOString().slice(0, 10)) {
  return {
    patientCount: countPatients(),
    appointmentCount: countAppointmentsByDate(referenceDate),
    revenueTotal: getRevenueTotal(referenceDate.slice(0, 7) + "-01", referenceDate),
  };
}