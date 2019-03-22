// @flow
const fs = require('fs');
const path = require('path');

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

function getIconFiles() {
    const dir = '/usr/share/icons/Papirus/';
    const dirs = fs.readdirSync(dir)
        .map(f => path.join(dir, f))
        .filter(f => fs.statSync(f).isDirectory());
    const icons = dirs.map(d =>
        fs.readdirSync(path.join(d, 'apps'))
            .map(f => path.join(d, 'apps', f)))
        .reduce((val, acc) => [...val, ...acc]);
    const iconMap = {};
    for (const icon of icons) {
        const parsed = path.parse(icon);
        if (!iconMap[parsed.name]) {
            iconMap[parsed.name] = [];
        }
        iconMap[parsed.name] = [...iconMap[parsed.name], icon];
    }
    for (const icon in iconMap) {
        const iconList = iconMap[icon];
        const bestIcon = iconList.sort((a, b) => {
            a = path.parse(a).dir.split('/')[5];
            b = path.parse(b).dir.split('/')[5];
            a = parseInt(a, 10);
            b = parseInt(b, 10);
            a = isNaN(a) ? 999999 : a;
            b = isNaN(b) ? 999999 : b;
            return b - a;
        })[0];
        iconMap[icon] = bestIcon;
    }
    return iconMap;
}

function getDesktopsEntry() {
    const desktops = process.env.XDG_DATA_DIRS.split(':')
        .filter(dir => fs.existsSync(path.join(dir, 'applications')))
        .filter(dir => fs.statSync(path.join(dir, 'applications')).isDirectory())
        .map(dir =>
            fs.readdirSync(path.join(dir, 'applications'))
                .map(f => path.join(dir, 'applications', f))
                .filter(f => !fs.statSync(f).isDirectory() && path.extname(f) === '.desktop'))
        .reduce((val, acc) => [...val, ...acc]);

    return desktops.map(desktop => parseDesktop(fs.readFileSync(desktop, 'UTF-8')));
}

function distillExec(exec) {
    return path.basename(exec.split(' ')[0]);
}

function getExecIconMap() {
    const desktops = getDesktopsEntry();
    return Object.assign({},
        ...desktops.filter(d => d['Desktop Entry'].Exec && d['Desktop Entry'].Icon)
            .map(d => ({[distillExec(d['Desktop Entry'].Exec)]: d['Desktop Entry'].Icon})));
}

const iconFiles = getIconFiles();
const execIconMap = getExecIconMap();

export function getIcon(proc) {
    if (proc.type === 'service') {
        return '../resources/service.svg';
    }
    const proc_name = distillExec(proc.cmdline);
    const icon_file = iconFiles[execIconMap[proc_name]];
    if (icon_file) {
        return `file://${icon_file}`;
    } else {
        if (proc.type === 'gui') {
            return '../resources/gui.svg';
        }
        return '../resources/unknown.svg';
    }
}

// console.log(getIcon({cmdline: '/usr/lib/chromium-browser/chromium-browser --type=renderer --file-url-path-alias=/gen=/usr/lib/chromium-browser/gen --field-trial-handle=1641691402646501808,8288607720916885489,131072 --lang=en-US --enable-offline-auto-reload --enable-offline-auto-reload-visible-only --num-raster-threads=2 --enable-main-frame-before-activation --service-request-channel-token=10963247097365425305 --renderer-client-id=321 --no-v8-untrusted-code-mitigations --shared-files=v8_context_snapshot_data:100,v8_natives_data:101'}));
