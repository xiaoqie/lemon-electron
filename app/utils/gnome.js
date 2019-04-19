// @flow
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {similarity} from "./longest-common-subsequence";
import {distillCmdline, getDisplayName, isInterpreter, isShell, parseComm, procUniqueID} from "./name";
import gtkTheme from './import-gtk-theme'
import {readdirFull} from "./index";

function parseDesktop(content) {
    let currentEntry = 'Unknown';
    const result = {};
    for (let line of content.split('\n')) {
        line = line.trim();
        if (!line) continue;
        if (line[0] === '#') continue;

        if (line[0] === '[') {
            currentEntry = line.substring(1, line.length - 1);
            result[currentEntry] = {};
        } else {
            const firstEqualSign = line.indexOf('=');
            result[currentEntry][line.substring(0, firstEqualSign)] = line.substring(firstEqualSign + 1);
        }
    }
    return result;
}

function getDesktopsEntry() {
    const desktops = [...process.env.XDG_DATA_DIRS.split(':'), path.join(os.homedir(), '.local/share')]
        .map(dir => path.join(dir, 'applications'))
        .filter(dir => fs.existsSync(dir))
        .filter(dir => fs.statSync(dir).isDirectory())
        .map(dir => readdirFull(dir)
            .filter(f => !fs.statSync(f).isDirectory() && path.extname(f) === '.desktop'))
        .concatElements();

    return desktops.map(desktop => parseDesktop(fs.readFileSync(desktop, 'UTF-8')));
}

function getMaps() {
    const desktops = getDesktopsEntry();
    const execIconMap = Object.assign(...desktops.filter(d => d['Desktop Entry'].Exec && d['Desktop Entry'].Icon)
        .map(d => ({[distillCmdline(d['Desktop Entry'].Exec.toLowerCase())]: d['Desktop Entry'].Icon})));
    execIconMap['chrome'] = 'chrome';
    execIconMap['python'] = 'python';
    execIconMap['java'] = 'java';
    execIconMap['python3'] = 'python';
    execIconMap['python2'] = 'python';

    const execDescriptionMap = Object.assign(...desktops.filter(d => d['Desktop Entry'].Exec && d['Desktop Entry'].Name)
        .map(d => ({[distillCmdline(d['Desktop Entry'].Exec.toLowerCase())]: d['Desktop Entry'].Name})));
    return {exec2Icon: execIconMap, exec2Description: execDescriptionMap};
}

function getExecDescriptionMap() {
    const desktops = getDesktopsEntry();
}

const {exec2Icon, exec2Description} = getMaps();
console.log(exec2Icon);

export function getDescription(proc) {
    const cmdline = distillCmdline(proc.cmdline).toLowerCase();
    const comm = parseComm(proc.comm).toLowerCase();
    const exe = path.basename(proc.exe).toLowerCase();
    if (!isInterpreter(proc)) {
        return exec2Description[comm] ?? exec2Description[exe] ?? exec2Description[cmdline];
    }
}

export function getIcon(proc, fuzzy=false) {
    if (proc.type === 'service') {
        return "dev.saki.lemon.fallback-service";
    }
    if (proc.type === 'wine') {
        return "dev.saki.lemon.fallback-wine";
    }
    const cmdline = getDisplayName(proc).toLowerCase();
    const comm = parseComm(proc.comm).toLowerCase();
    const exe = path.basename(proc.exe).toLowerCase();
    let icon = exec2Icon[comm] ?? exec2Icon[exe] ?? exec2Icon[cmdline];
    if (!icon && fuzzy) {
        const minScore = 1;
        const highScore = Object.keys(exec2Icon).reduce((max, exec) => {
            const sim = similarity(exec, cmdline);
            return sim >= max.sim ? {sim, exec} : max;
        }, {sim: minScore});
        if (highScore.sim > 1) {
            icon = exec2Icon[highScore.exec];
        }
    }
    if (icon) {
        return icon;
    }
    if (proc.type === 'gui') {
        return "dev.saki.lemon.fallback-gui";
    }
    if (proc.isShell) {
        return "dev.saki.lemon.fallback-terminal";
    }
    // return "dev.saki.lemon.fallback-unknown";
    return "application-x-executable-symbolic";
}

let iconCache = {};

export function getIconURL(proc) {
    let icon;
    const id = procUniqueID(proc);
    if (id in iconCache) {
        icon = iconCache[id];
    } else {
        icon = getIcon(proc, proc.type === 'gui');
        iconCache[id] = icon;
    }
    if (Object.keys(iconCache).length > 10000) {
        console.log("icon cache is too large, clearing");
        iconCache = {};
    }
    if (path.isAbsolute(icon)) {
        return icon;
    }
    const iconFile = gtkTheme()?.iconMap[icon];
    if (!iconFile) {
        return `file://${path.resolve(__dirname, 'gtk/icons/scalable/mimetypes/application-x-executable-symbolic.svg')}`;
    }
    return `file://${iconFile}`;
}

// console.log(getIcon({cmdline: '/usr/lib/chromium-browser/chromium-browser --type=renderer --file-url-path-alias=/gen=/usr/lib/chromium-browser/gen --field-trial-handle=1641691402646501808,8288607720916885489,131072 --lang=en-US --enable-offline-auto-reload --enable-offline-auto-reload-visible-only --num-raster-threads=2 --enable-main-frame-before-activation --service-request-channel-token=10963247097365425305 --renderer-client-id=321 --no-v8-untrusted-code-mitigations --shared-files=v8_context_snapshot_data:100,v8_natives_data:101'}));
