export interface Patient {
  id: string;
  name: string;
  age: number;
  address: string;
  lastConsultation: string;
  phone: string;
  gender: "M" | "Mme" | "Mlle";
  profession: string;
  children: number;
  familyStatus: string;
  cardNumber?: string;
  firstName?: string;
  lastName?: string;
  ageMonths?: number;
  weightKg?: number;
  heightCm?: number;
  personalHistory?: string;
  familyHistory?: string;
  note?: string;
}

export interface Appointment {
  id: string;
  patientName: string;
  type: string;
  time: string;
  date: string;
  status: "urgent" | "normal";
}

export interface Consultation {
  id: string;
  patientId: string;
  date: string;
  motif: string;
  clinicalExam: string;
  vitals: {
    bloodPressure: string;
    temperature: string;
  };
  diagnostic: string;
  treatment: {
    name: string;
    dosage: string;
  }[];
}
