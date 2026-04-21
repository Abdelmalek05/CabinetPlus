import { app, BrowserWindow, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { registerIpcHandlers } from "../handlers/ipc.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const startUrl = process.env.ELECTRON_START_URL || "http://localhost:3000";

if (process.platform === "win32") {
  app.disableHardwareAcceleration();
  app.commandLine.appendSwitch("disable-gpu");
}

process.on("uncaughtException", (error) => {
  console.error("[electron/main] uncaughtException", error);
});

process.on("unhandledRejection", (reason) => {
  console.error("[electron/main] unhandledRejection", reason);
});

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.loadURL(startUrl);

  // if (isDev) {
  //   mainWindow.webContents.openDevTools({ mode: "detach" });
  // }
}

registerIpcHandlers();

app.whenReady().then(() => {
  createMainWindow();

  app.on("render-process-gone", (_event, webContents, details) => {
    console.error("[electron/main] render-process-gone", {
      reason: details.reason,
      exitCode: details.exitCode,
      url: webContents.getURL(),
    });
  });

  app.on("child-process-gone", (_event, details) => {
    console.error("[electron/main] child-process-gone", details);
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
