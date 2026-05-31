const { app, BrowserWindow } = require("electron");
const path = require("path");

// Import the Express app (doesn't auto-listen when required)
const serverApp = require("../server");

let mainWindow = null;
let server = null;

function createServer() {
  return new Promise((resolve) => {
    const PORT = process.env.PORT || 3000;
    server = serverApp.listen(PORT, () => {
      console.log(`[Electron] Server running on port ${PORT}`);
      resolve(PORT);
    });
  });
}

function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, "..", "public", "icon.ico"),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(`http://localhost:${port}`);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  const port = await createServer();
  createWindow(port);
});

app.on("window-all-closed", () => {
  // Close the server when all windows are closed
  if (server) {
    server.close();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createServer().then((port) => createWindow(port));
  }
});
