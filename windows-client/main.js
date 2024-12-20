const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const pathModule = require('path');

let appWindow;
let cameraPermissionStatus = 'prompt';

function initWindow() {
    appWindow = new BrowserWindow({
        // fullscreen: true,
        height: 800,
        width: 1000,
        webPreferences: {
            nodeIntegration: true,
            webSecurity: false,
            preload: pathModule.join(__dirname, '/preload.js'),
        },
        icon: __dirname + '/dist/client/assets/pictures/logo.png',
    });

    // Electron Build Path
    const path = `file://${__dirname}/dist/client/index.html`;
    appWindow.loadURL(path);

    appWindow.setMenuBarVisibility(false);

    // Initialize the DevTools.
    // appWindow.webContents.openDevTools();

    appWindow.on('closed', function () {
        appWindow = null;
    });
}

app.on('ready', initWindow);

// Close when all windows are closed.
app.on('window-all-closed', function () {
    // On macOS specific close process
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (appWindow === null) {
        initWindow();
    }
});

ipcMain.handle('request-camera-access', async (event) => {
    if (cameraPermissionStatus === 'granted') {
        return true;
    }
    try {
        const dialogResponse = await dialog.showMessageBox(appWindow, {
            type: 'info',
            buttons: ['Oui', 'Non'],
            defaultId: 0,
            cancelId: 1,
            message: 'Autoriser Mismatch à prendre des photos ?',
        });

        const granted = dialogResponse.response === 0;
        cameraPermissionStatus = granted ? 'granted' : 'denied';
        return granted;
    } catch (error) {
        console.error('Error requesting camera access:', error);
        return false;
    }
});
