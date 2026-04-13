import { contextBridge, ipcRenderer } from "electron";
import { IPC_CHANNELS } from "../../src/shared/ipc-contracts.ts";

function invoke(channel, ...args) {
  return ipcRenderer.invoke(channel, ...args);
}

contextBridge.exposeInMainWorld("cabinet", {
  app: {
    ping: () => invoke(IPC_CHANNELS.appPing),
    versions: {
      chrome: process.versions.chrome,
      electron: process.versions.electron,
      node: process.versions.node,
    },
  },
  patients: {
    list: (options) => invoke(IPC_CHANNELS.patientsList, options),
    get: (id) => invoke(IPC_CHANNELS.patientsGet, id),
    create: (input) => invoke(IPC_CHANNELS.patientsCreate, input),
    update: (id, input) => invoke(IPC_CHANNELS.patientsUpdate, id, input),
    remove: (id) => invoke(IPC_CHANNELS.patientsDelete, id),
    search: (query, limit) => invoke(IPC_CHANNELS.patientsSearch, query, limit),
    count: () => invoke(IPC_CHANNELS.patientsCount),
  },
  appointments: {
    list: (options) => invoke(IPC_CHANNELS.appointmentsList, options),
    get: (id) => invoke(IPC_CHANNELS.appointmentsGet, id),
    create: (input) => invoke(IPC_CHANNELS.appointmentsCreate, input),
    update: (id, input) => invoke(IPC_CHANNELS.appointmentsUpdate, id, input),
    remove: (id) => invoke(IPC_CHANNELS.appointmentsDelete, id),
    countByDate: (date) => invoke(IPC_CHANNELS.appointmentsCountByDate, date),
  },
  consultations: {
    byPatient: (patientId) => invoke(IPC_CHANNELS.consultationsByPatient, { patientId }),
    get: (id) => invoke(IPC_CHANNELS.consultationsGet, id),
    create: (input) => invoke(IPC_CHANNELS.consultationsCreate, input),
    remove: (id) => invoke(IPC_CHANNELS.consultationsDelete, id),
  },
  prescriptions: {
    byConsultation: (consultationId) => invoke(IPC_CHANNELS.prescriptionsByConsultation, { consultationId }),
    add: (input) => invoke(IPC_CHANNELS.prescriptionsAdd, input),
    remove: (id) => invoke(IPC_CHANNELS.prescriptionsDelete, id),
  },
  revenue: {
    list: (range) => invoke(IPC_CHANNELS.revenueList, range),
    total: (range) => invoke(IPC_CHANNELS.revenueTotal, range),
  },
  auth: {
    login: (login, password) => invoke(IPC_CHANNELS.authLogin, { login, password }),
  },
  documents: {
    arretMaladie: {
      list: (options) => invoke(IPC_CHANNELS.arretMaladieList, options),
      get: (id) => invoke(IPC_CHANNELS.arretMaladieGet, id),
      create: (input) => invoke(IPC_CHANNELS.arretMaladieCreate, input),
      update: (id, input) => invoke(IPC_CHANNELS.arretMaladieUpdate, id, input),
      remove: (id) => invoke(IPC_CHANNELS.arretMaladieDelete, id),
    },
    arretTravail: {
      list: (options) => invoke(IPC_CHANNELS.arretTravailList, options),
      get: (id) => invoke(IPC_CHANNELS.arretTravailGet, id),
      create: (input) => invoke(IPC_CHANNELS.arretTravailCreate, input),
      update: (id, input) => invoke(IPC_CHANNELS.arretTravailUpdate, id, input),
      remove: (id) => invoke(IPC_CHANNELS.arretTravailDelete, id),
    },
    bilan: {
      list: (options) => invoke(IPC_CHANNELS.bilanList, options),
      get: (id) => invoke(IPC_CHANNELS.bilanGet, id),
      create: (input) => invoke(IPC_CHANNELS.bilanCreate, input),
      update: (id, input) => invoke(IPC_CHANNELS.bilanUpdate, id, input),
      remove: (id) => invoke(IPC_CHANNELS.bilanDelete, id),
    },
  },
  messages: {
    list: (options) => invoke(IPC_CHANNELS.messageList, options),
    get: (id) => invoke(IPC_CHANNELS.messageGet, id),
    create: (input) => invoke(IPC_CHANNELS.messageCreate, input),
    update: (id, input) => invoke(IPC_CHANNELS.messageUpdate, id, input),
    remove: (id) => invoke(IPC_CHANNELS.messageDelete, id),
  },
});
