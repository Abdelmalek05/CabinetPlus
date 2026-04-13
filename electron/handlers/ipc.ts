import { ipcMain } from "electron";
import { IPC_CHANNELS } from "../../src/shared/ipc-contracts";
import { addPrescription, createConsultation, deleteConsultation, deletePrescription, getConsultationById, listConsultationsByPatient, listPrescriptionsByConsultation } from "../repositories/consultation-repository";
import { createAppointment, deleteAppointment, getAppointmentById, listAppointments, updateAppointment, countAppointmentsByDate } from "../repositories/appointment-repository";
import { createPatient, deletePatient, getPatientById, listPatients, searchPatients, updatePatient, countPatients } from "../repositories/patient-repository";
import { listRevenueRows, getRevenueTotal } from "../repositories/billing-repository";
import { findAccountByLogin } from "../repositories/auth-repository";
import { createArretMaladie, deleteArretMaladie, getArretMaladieById, listArretMaladies, updateArretMaladie } from "../repositories/arretmaladie-repository";
import { createArretTravail, deleteArretTravail, getArretTravailById, listArretTravails, updateArretTravail } from "../repositories/arretravail-repository";
import { createBilan, deleteBilan, getBilanById, listBilans, updateBilan } from "../repositories/bilan-repository";
import { createMessage, deleteMessage, getMessageById, listMessages, updateMessage } from "../repositories/message-repository";

function publicAccount(account: ReturnType<typeof findAccountByLogin>) {
  if (!account) return null;

  const safeAccount = { ...account };
  delete safeAccount.password;
  return safeAccount;
}

export function registerIpcHandlers() {
  ipcMain.handle(IPC_CHANNELS.appPing, async () => ({ ok: true, message: "pong" }));

  ipcMain.handle(IPC_CHANNELS.patientsList, async (_event, options) => listPatients(options));
  ipcMain.handle(IPC_CHANNELS.patientsGet, async (_event, id) => getPatientById(id));
  ipcMain.handle(IPC_CHANNELS.patientsCreate, async (_event, input) => createPatient(input));
  ipcMain.handle(IPC_CHANNELS.patientsUpdate, async (_event, id, input) => updatePatient(id, input));
  ipcMain.handle(IPC_CHANNELS.patientsDelete, async (_event, id) => deletePatient(id));
  ipcMain.handle(IPC_CHANNELS.patientsSearch, async (_event, query, limit) => searchPatients(query, limit));
  ipcMain.handle(IPC_CHANNELS.patientsCount, async () => countPatients());

  ipcMain.handle(IPC_CHANNELS.appointmentsList, async (_event, options) => listAppointments(options));
  ipcMain.handle(IPC_CHANNELS.appointmentsGet, async (_event, id) => getAppointmentById(id));
  ipcMain.handle(IPC_CHANNELS.appointmentsCreate, async (_event, input) => createAppointment(input));
  ipcMain.handle(IPC_CHANNELS.appointmentsUpdate, async (_event, id, input) => updateAppointment(id, input));
  ipcMain.handle(IPC_CHANNELS.appointmentsDelete, async (_event, id) => deleteAppointment(id));
  ipcMain.handle(IPC_CHANNELS.appointmentsCountByDate, async (_event, date) => countAppointmentsByDate(date));

  ipcMain.handle(IPC_CHANNELS.consultationsByPatient, async (_event, { patientId }) => listConsultationsByPatient(patientId));
  ipcMain.handle(IPC_CHANNELS.consultationsGet, async (_event, id) => getConsultationById(id));
  ipcMain.handle(IPC_CHANNELS.consultationsCreate, async (_event, input) => createConsultation(input));
  ipcMain.handle(IPC_CHANNELS.consultationsDelete, async (_event, id) => deleteConsultation(id));

  ipcMain.handle(IPC_CHANNELS.prescriptionsByConsultation, async (_event, { consultationId }) => listPrescriptionsByConsultation(consultationId));
  ipcMain.handle(IPC_CHANNELS.prescriptionsAdd, async (_event, input) => addPrescription(input));
  ipcMain.handle(IPC_CHANNELS.prescriptionsDelete, async (_event, id) => deletePrescription(id));

  ipcMain.handle(IPC_CHANNELS.revenueList, async (_event, { startDate, endDate }) => listRevenueRows(startDate, endDate));
  ipcMain.handle(IPC_CHANNELS.revenueTotal, async (_event, { startDate, endDate }) => getRevenueTotal(startDate, endDate));

  ipcMain.handle(IPC_CHANNELS.arretMaladieList, async (_event, options) => listArretMaladies(options));
  ipcMain.handle(IPC_CHANNELS.arretMaladieGet, async (_event, id) => getArretMaladieById(id));
  ipcMain.handle(IPC_CHANNELS.arretMaladieCreate, async (_event, input) => createArretMaladie(input));
  ipcMain.handle(IPC_CHANNELS.arretMaladieUpdate, async (_event, id, input) => updateArretMaladie(id, input));
  ipcMain.handle(IPC_CHANNELS.arretMaladieDelete, async (_event, id) => deleteArretMaladie(id));

  ipcMain.handle(IPC_CHANNELS.arretTravailList, async (_event, options) => listArretTravails(options));
  ipcMain.handle(IPC_CHANNELS.arretTravailGet, async (_event, id) => getArretTravailById(id));
  ipcMain.handle(IPC_CHANNELS.arretTravailCreate, async (_event, input) => createArretTravail(input));
  ipcMain.handle(IPC_CHANNELS.arretTravailUpdate, async (_event, id, input) => updateArretTravail(id, input));
  ipcMain.handle(IPC_CHANNELS.arretTravailDelete, async (_event, id) => deleteArretTravail(id));

  ipcMain.handle(IPC_CHANNELS.bilanList, async (_event, options) => listBilans(options));
  ipcMain.handle(IPC_CHANNELS.bilanGet, async (_event, id) => getBilanById(id));
  ipcMain.handle(IPC_CHANNELS.bilanCreate, async (_event, input) => createBilan(input));
  ipcMain.handle(IPC_CHANNELS.bilanUpdate, async (_event, id, input) => updateBilan(id, input));
  ipcMain.handle(IPC_CHANNELS.bilanDelete, async (_event, id) => deleteBilan(id));

  ipcMain.handle(IPC_CHANNELS.messageList, async (_event, options) => listMessages(options?.limit, options?.offset));
  ipcMain.handle(IPC_CHANNELS.messageGet, async (_event, id) => getMessageById(id));
  ipcMain.handle(IPC_CHANNELS.messageCreate, async (_event, input) => createMessage(input));
  ipcMain.handle(IPC_CHANNELS.messageUpdate, async (_event, id, input) => updateMessage(id, input));
  ipcMain.handle(IPC_CHANNELS.messageDelete, async (_event, id) => deleteMessage(id));

  ipcMain.handle(IPC_CHANNELS.authLogin, async (_event, { login, password }) => {
    const account = findAccountByLogin(login);

    if (!account || account.password !== password) {
      return { ok: false, message: "Identifiants invalides." };
    }

    return { ok: true, account: publicAccount(account) };
  });
}