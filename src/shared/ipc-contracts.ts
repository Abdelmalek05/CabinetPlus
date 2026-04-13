export const IPC_CHANNELS = {
  appPing: "app:ping",
  patientsList: "patients:list",
  patientsGet: "patients:get",
  patientsCreate: "patients:create",
  patientsUpdate: "patients:update",
  patientsDelete: "patients:delete",
  patientsSearch: "patients:search",
  patientsCount: "patients:count",
  appointmentsList: "appointments:list",
  appointmentsGet: "appointments:get",
  appointmentsCreate: "appointments:create",
  appointmentsUpdate: "appointments:update",
  appointmentsDelete: "appointments:delete",
  appointmentsCountByDate: "appointments:count-by-date",
  consultationsByPatient: "consultations:by-patient",
  consultationsGet: "consultations:get",
  consultationsCreate: "consultations:create",
  consultationsDelete: "consultations:delete",
  prescriptionsByConsultation: "prescriptions:by-consultation",
  prescriptionsAdd: "prescriptions:add",
  prescriptionsDelete: "prescriptions:delete",
  revenueList: "revenue:list",
  revenueTotal: "revenue:total",
  authLogin: "auth:login",
  arretMaladieList: "arretmaladie:list",
  arretMaladieGet: "arretmaladie:get",
  arretMaladieCreate: "arretmaladie:create",
  arretMaladieUpdate: "arretmaladie:update",
  arretMaladieDelete: "arretmaladie:delete",
  arretTravailList: "arretravail:list",
  arretTravailGet: "arretravail:get",
  arretTravailCreate: "arretravail:create",
  arretTravailUpdate: "arretravail:update",
  arretTravailDelete: "arretravail:delete",
  bilanList: "bilan:list",
  bilanGet: "bilan:get",
  bilanCreate: "bilan:create",
  bilanUpdate: "bilan:update",
  bilanDelete: "bilan:delete",
  messageList: "message:list",
  messageGet: "message:get",
  messageCreate: "message:create",
  messageUpdate: "message:update",
  messageDelete: "message:delete",
} as const;

export type AppPingResult = {
  ok: boolean;
  message: string;
};

export type PatientListRequest = {
  query?: string;
  familyStatus?: string;
  limit?: number;
  offset?: number;
};

export type AppointmentListRequest = {
  date?: string;
  patientId?: string | number;
  limit?: number;
};

export type ConsultationByPatientRequest = {
  patientId: string | number;
};

export type PrescriptionByConsultationRequest = {
  consultationId: string | number;
};

export type RevenueRequest = {
  startDate: string;
  endDate: string;
};

export type LoginRequest = {
  login: string;
  password: string;
};

export type DocumentQueryRequest = {
  patientId?: string | number;
  consultationId?: string | number;
  limit?: number;
  offset?: number;
};

export type MessageListRequest = {
  limit?: number;
  offset?: number;
};
