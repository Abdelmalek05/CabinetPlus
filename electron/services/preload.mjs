import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("cabinet", {
  app: {
    ping: () => ipcRenderer.invoke("app:ping"),
    versions: {
      chrome: process.versions.chrome,
      electron: process.versions.electron,
      node: process.versions.node,
    },
  },
});
