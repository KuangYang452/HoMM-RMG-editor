import { app, BrowserWindow } from 'electron';
import path from 'path';

// Fix missing __dirname type definition
declare const __dirname: string;

process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');

let win: BrowserWindow | null;

function createWindow() {
  win = new BrowserWindow({
    width: 1400,
    height: 900,
    icon: path.join(process.env.VITE_PUBLIC||"", 'icon.png'), // Optional: requires icon file
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, // For simple interaction, set to true + preload for security in prod
    },
    autoHideMenuBar: true,
    backgroundColor: '#0f172a'
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    // Load the index.html of the app.
    win.loadFile(path.join(process.env.DIST||"", 'index.html'));
  }
}

app.on('window-all-closed', () => {
  // Cast process to any to avoid type error with missing platform property
  if ((process as any).platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);