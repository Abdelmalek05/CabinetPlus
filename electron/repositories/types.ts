import type { Appointment, Patient } from "@/app/types";

export type LoginAccount = {
  id: number;
  login: string;
  password: string;
  name: string;
  firstName: string;
  specialite: string;
  address: string;
  ville: string;
  tel: string;
  mail: string;
  lastAccess: string;
  ip: string;
};

export type PatientRecord = Patient;

export type AppointmentRecord = Appointment;

export type PatientCreateInput = {
  cardNumber?: string;
  firstName: string;
  lastName: string;
  age: number;
  ageMonths?: number;
  gender: Patient["gender"];
  profession?: string;
  familyStatus?: string;
  children?: number;
  address?: string;
  phone?: string;
  weightKg?: number;
  heightCm?: number;
  personalHistory?: string;
  familyHistory?: string;
  note?: string;
};

export type PatientUpdateInput = Partial<PatientCreateInput>;

export type AppointmentCreateInput = {
  patientId: string | number;
  date: string;
  time?: string;
  consultId?: string | number | null;
  state?: number | null;
};

export type ConsultationCreateInput = {
  patientId: string | number;
  date: string;
  time?: string;
  tarif?: number | null;
  constat?: string;
  diagnostic?: string;
  exploration?: string;
  maladie?: string;
  traitement?: string;
  note?: string;
};

export type PrescriptionCreateInput = {
  consultationId: string | number;
  patientId: string | number;
  medicament: string;
  type: string;
  prise: string;
  duree: string;
};

export type RevenueRow = {
  consultationId: string;
  patientId: string;
  patientName: string;
  address: string;
  date: string;
  amount: number;
};

export type DocumentQueryOptions = {
  patientId?: string | number;
  consultationId?: string | number;
  limit?: number;
  offset?: number;
};

export type ArretMaladieCreateInput = {
  text: string;
  dateDebut: string;
  dateFin: string;
  patientId: string | number;
  consultationId: string | number;
};

export type ArretTravailCreateInput = ArretMaladieCreateInput;

export type BilanCreateInput = {
  avant: string;
  bilan: string;
  salut: string;
  patientId: string | number;
  consultationId: string | number;
};

export type MessageCreateInput = {
  nom: string;
  email: string;
  tel: string;
  message: string;
  medecin: string;
};

export type MessageUpdateInput = Partial<MessageCreateInput>;