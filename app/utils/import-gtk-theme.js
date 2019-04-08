import loadTheme from '../electron-gtk-theme'
import {spawn, exec} from 'child_process';

let theme;
const listeners = [];

async function load() {
    theme = await loadTheme({outputPath: `${__dirname}/gtk-theme`});
}

function listen(exe, args) {
    const io = spawn(exe, args, {shell: false, env: process.env});
    listeners.push(io);
    io.stdout.on('data', () => load());

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

load();
listen("gsettings", ["monitor", "org.gnome.desktop.interface", "gtk-theme"]);
listen("gsettings", ["monitor", "org.gnome.desktop.interface", "font-name"]);
listen("gsettings", ["monitor", "org.gnome.desktop.interface", "icon-theme"]);

export default () => theme;
