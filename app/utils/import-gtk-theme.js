import loadTheme from '../gluino'
import {spawn} from 'child_process';
import {remote} from 'electron';
import * as path from 'path';


let theme;
const listeners = [];

async function load(reloadIcon = false) {
    theme = await loadTheme({
        dataDir: `${__dirname}/gtk/`,
        outputDir: path.join(remote.app.getPath('appData'), 'lemon-electron'),
        iconCache: reloadIcon ? null : {iconMap: theme?.iconMap, glyphMap: theme?.glyphMap}
    });
}

function listen(exe, args, reloadIcon = false) {
    const io = spawn(exe, args, {shell: false, env: process.env});
    listeners.push(io);
    io.stdout.on('data', () => load(reloadIcon));

    io.stderr.on('data', (data) => {
        console.log(`stderr: ${data}`);
    });

    io.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });
    io.on('error', error => {
        console.log(`error: ${error}`);
    })
}

/**
 * At least in development, you should call this when reload.
 */
export function closeListeners() {
    for (const listener of listeners) {
        listener.kill();
        console.log("try to kill listener")
    }
}

load(true);
listen("gsettings", ["monitor", "org.gnome.desktop.interface", "gtk-theme"]);
listen("gsettings", ["monitor", "org.gnome.desktop.interface", "font-name"]);
listen("gsettings", ["monitor", "org.gnome.desktop.interface", "icon-theme"], true);

export default () => theme;
