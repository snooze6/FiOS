const {app, BrowserWindow} = require('electron');
const path = require('path');
const url = require('url');
const dialog = require('electron').dialog;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

__dirname = __dirname+'/app';
app.showExitPrompt = true;

function createWindow () {
    // Create the browser window.
    win = new BrowserWindow({
        width: 1050,
        height: 800,
        icon: __dirname+'/img/favicon.ico',
        minHeight: 1050,
        minWidth: 800
    });
    // // TODO: Delete menu
    // win.setMenu(null);

    // and load the index.html of the app.
    win.loadURL(url.format({
        pathname: path.join(__dirname, 'index.html'),
        protocol: 'file:',
        slashes: true
    }));

    // Open the DevTools.
    // win.webContents.openDevTools();

    // // Weia
    // win.on('close', (e) => {
    //     if (app.showExitPrompt) {
    //         e.preventDefault(); // Prevents the window from closing
    //         dialog.showMessageBox({
    //             type: 'question',
    //             buttons: ['Yes', 'No'],
    //             title: 'Confirm',
    //             message: 'Unsaved data will be lost. Are you sure you want to quit?'
    //         }, function (response) {
    //             if (response === 0) { // Runs the following if 'Yes' is clicked
    //                 app.showExitPrompt = false;
    //                 win.close()
    //             }
    //         })
    //     }
    // })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// // Quit when all windows are closed.
// app.on('window-all-closed', () => {
//     // On macOS it is common for applications and their menu bar
//     // to stay active until the user quits explicitly with Cmd + Q
//     if (process.platform !== 'darwin') {
//         app.quit()
//     }
// });

app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
        createWindow()
    }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.