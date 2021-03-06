/* eslint global-require: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `yarn build` or `yarn build-main`, this file is compiled to
 * `./app/main.prod.js` using webpack. This gives us some performance wins.
 *
 * @flow
 */
import {app, BrowserWindow} from 'electron';
import {autoUpdater} from 'electron-updater';
import log from 'electron-log';
import WebSocket from "ws";
import MenuBuilder from './menu';
import initialState from './constants/initial-state';
import * as LogAction from "./actions/log";

app.commandLine.appendSwitch('js-flags', '--expose_gc');

export default class AppUpdater {
    constructor() {
        log.transports.file.level = 'info';
        autoUpdater.logger = log;
        autoUpdater.checkForUpdatesAndNotify();
    }
}

let mainWindow = null;

if (process.env.NODE_ENV === 'production') {
    const sourceMapSupport = require('source-map-support');
    sourceMapSupport.install();
}

if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
) {
    require('electron-debug')();
}

const installExtensions = async () => {
    const installer = require('electron-devtools-installer');
    const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
    const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

    return Promise.all(
        extensions.map(name => installer.default(installer[name], forceDownload))
    ).catch(console.log);
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
    // Respect the OSX convention of having the application in memory even
    // after all windows have been closed
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

async function createWindow() {
    if (
        process.env.NODE_ENV === 'development' ||
        process.env.DEBUG_PROD === 'true'
    ) {
        await installExtensions();
    }

    mainWindow = new BrowserWindow({
        icon: `${__dirname}/dist/icons/64x64.png`,
        // transparent: true,
        frame: false,
        show: false,
        width: 1024,
        height: 728
    });
    mainWindow.loadURL(`file://${__dirname}/app.html`);

    // @TODO: Use 'ready-to-show' event
    //        https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
    mainWindow.webContents.on('did-finish-load', () => {
        if (!mainWindow) {
            throw new Error('"mainWindow" is not defined');
        }
        if (process.env.START_MINIMIZED) {
            mainWindow.minimize();
        } else {
            mainWindow.show();
            mainWindow.focus();
        }
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    const menuBuilder = new MenuBuilder(mainWindow);
    menuBuilder.buildMenu();
    // mainWindow.webContents.openDevTools()

    // Remove this if your app does not use auto updates
    // eslint-disable-next-line
    // new AppUpdater();
}

function _createWindowTransparent() {
    mainWindow = new BrowserWindow({
        icon: `${__dirname}/dist/icons/64x64.png`,
        width: 1024,
        height: 768,
        transparent: true,
        frame: false,
        webPreferences: {
            experimentalFeatures: true
        }
        // resizable: false
    });

    mainWindow.once('close', () => {
        mainWindow = null;
    });

    mainWindow.loadURL(`file://${__dirname}/app.html`);
    if (process.env.DEBUG_PROD === 'true') {
        mainWindow.webContents.openDevTools();
    }
}

const createWindowTransparent = () => setTimeout(_createWindowTransparent, 500);

app.on('ready', createWindowTransparent);

/*
const port = 8089;
const ws = new WebSocket(`ws://127.0.0.1:${port}`);

ws.on('open', () => {
    ws.send('something');
});

ws.on('message', (data) => {
    const syslog = JSON.parse(data);
    mainWindow?.webContents.send("log", LogAction.process(syslog, initialState.config));
});
*/

