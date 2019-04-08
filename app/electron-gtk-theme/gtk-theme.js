import fs from 'fs';
import {join} from 'path';
import {homedir} from 'os';
import {execSync} from 'child_process';
import desktopEnv from 'desktop-env';
import {uniq} from 'lodash';
import postgtk from './postcss-gtk/postcss-gtk';
import {filter, each, walk} from './utils';
import * as path from 'path';
import * as util from 'util';

function getFolder(dir) {
    try {
        fs.statSync(dir);
        return dir;
    } catch (e) {
        return null;
    }
}

async function readdirFull(dir) {
    return (await util.promisify(fs.readdir)(dir)).map(f => path.join(dir, f));
}

Array.prototype.concatElements = function concatArrays() {
    return [].concat.apply([], this);
};

async function getIconMap(rootDirs) {
    const dirs = (await Promise.all(rootDirs.map(async (dir) => (await readdirFull(dir))
        .filter(f => (fs.statSync(f)).isDirectory()))))
        .concatElements();
    const iconDirs = (await Promise.all(dirs.map(async d => await readdirFull(d))))
        .concatElements();
    const icons = (await Promise.all(iconDirs.map(async d => await readdirFull(d))))
        .concatElements();
    const iconMap = {};
    for (const icon of icons) {
        const parsed = path.parse(icon);
        if (!iconMap[parsed.name]) {
            iconMap[parsed.name] = [];
        }
        iconMap[parsed.name].push(icon);
    }
    for (const icon in iconMap) {
        const iconList = iconMap[icon];
        const score = (s: string) => {
            if (s === "scalable") return Number.MAX_SAFE_INTEGER;
            let multiplier = 1;
            let str = s;
            if (str.endsWith("@2x")) {
                multiplier = 2;
                str = s.slice(0, -3);
            }
            const parts = str.split("x");
            if (parts.length !== 2 || parts[0] !== parts[1]) return -1;
            return parseInt(parts[0], 10) * multiplier;
        };
        const bestIcon = iconList.sort((a: string, b: string) => {
            return score(b) - score(a);
        })[0];
        iconMap[icon] = bestIcon;
    }
    return iconMap;
}

async function getIconTheme({environment, themeName, config}) {
    let schema;
    if (environment === 'Cinnamon') {
        schema = 'org.cinnamon.desktop.interface icon-theme';
    } else {
        schema = 'org.gnome.desktop.interface icon-theme';
    }
    let iconTheme = execSync(`gsettings get ${schema}`, {encoding: 'utf8'})
        .split(`'`).join('').replace(/\n$/, '');
    let iconDirectory = '/usr/share/icons/';
    if (iconTheme.indexOf('Mint-X') > -1) {
        iconTheme = 'Mint-X';
    }
    if (false) {
        iconDirectory = `/snap/${themeName.toLocaleLowerCase()}/current/share/icons/`;
        iconTheme = themeName;
    }
    return getIconMap([
        path.join(iconDirectory, iconTheme),
        // path.join(iconDirectory, 'hicolor'),
        path.join(config.outputPath, "fallback-icons")
    ]);
}

function getFont() {
    const fontName = execSync('gsettings get org.gnome.desktop.interface font-name', {encoding: 'utf8'})
        .split("'").join('').replace(/\n$/, '');
    const parts = fontName.split(' ');
    return {font: parts.slice(0, -1).join(' '), size: parts.slice(-1)[0]};
}

export default async function getTheme(config) {
    const {outputPath} = config;
    const environment = await desktopEnv();
    let schema;
    if (environment === 'Cinnamon') {
        schema = 'org.cinnamon.desktop.interface gtk-theme';
    } else {
        schema = 'org.gnome.desktop.interface gtk-theme';
    }
    const gtkTheme = execSync(`gsettings get ${schema}`, {encoding: 'utf8'});
    const themeName = gtkTheme.split(`'`).join('').replace(/\n$/, '');
    const decorationLayout = execSync('gsettings get org.gnome.desktop.wm.preferences button-layout', {encoding: 'utf8'})
        .split(`'`).join('').replace(/\n$/, '');
    const arrayOfButtons = decorationLayout.split(':');
    const supportedButtons = arrayOfButtons.filter(button => button !== 'appmenu')[0].split(',');

    const globalTheme = getFolder(`/usr/share/themes/${themeName}`);
    const userTheme = getFolder(`${homedir()}/.themes/${themeName}`);
    const fallbackTheme = getFolder(`${outputPath}/${themeName}`);
    const snapTheme = getFolder(`/snap/${themeName.toLocaleLowerCase()}/current/share/themes/${themeName}`);
    const dir = 'gtk-3.0';
    const fileName = 'gtk';
    let buttonLayout = 'right';
    const theme = fallbackTheme ?? snapTheme ?? userTheme ?? globalTheme;
    console.log(theme);

    if (decorationLayout.indexOf(':') === decorationLayout.length - 1) {
        buttonLayout = 'left';
    }

    const out = {
        environment,
        themeName,
        decorationLayout,
        buttonLayout,
        supportedButtons,
        root: theme || {},
        dir: `${theme}/${dir}/`,
    };
    out.iconMap = await getIconTheme({environment, themeName, config});

    const getCSS = (path, r = 0) => {
        let cssString;
        try {
            cssString = fs.readFileSync(path, {encoding: 'utf8'});
        } catch (e) { // TODO: Make GTK version configurable
            cssString = fs.readFileSync(path.replace(/3\.0/g, '3.20'), {encoding: 'utf8'});
            // return "";
        }
        if (cssString.indexOf('resource://') > -1) {
            console.log("fallback to ./gtk.css");
            return getCSS(join(outputPath, './gtk.css'), r);
        }
        const overrides = [
            [/(url\()(")/g, `$1"${theme}/${dir}/`],
            [/(-gtk-scaled\()(.*)(\),)(.*)(\))/g, `$2)`],
            [/(-gtk-recolor\()(.*)(\))/g, `$2`],
            [/(image\(#)(.*)(\))/g, `linear-gradient(#$2, #$2)`],
            [/:checked/g, `.checked`],
            [/:disabled/g, `.disabled`],
            [/:indeterminate/g, `.indeterminate`],
            [/:dir\(ltr\)/g, `:not(.dir-rtl)`],
            [/:dir\(rtl\)/g, `.dir-rtl`],
            [/-gtk-icon-source:/g, `background-image:`],
            // [/(@import url\(")([\w|\-|.|/]+)("\))/g, `$1${theme}/${dir}/$2$3`],
            // [/[^:]hover/g, 'a:hover'],
            // [/\.button/g, 'button'],
/*
            [/button\:link/g, 'a'],
            [/button\:visited/g, 'a:visited'],
            [/button {/g, 'button, .checkbox {'],
            [/button\:checked/g, 'input:checked'],
            [/[^\.|\-|@]radio\b/g, ' input[type=radio]'],
            [/(?!\/)([^\-|@])\bcheck\b/g, '$1input[type=checkbox]'],
            [/\bentry\b/g, 'input'],
            [/[^\.\-|@]scalescale/g, '.scale'],
            [/\:selected/g, '.selected'],
            [/\-gtk\-icon\-transform\:/g, 'transform:'],
            [/\-gtk\-outline\-bottom\-right\-radius\:/g, 'border-bottom-right-radius:'],
            [/\-gtk\-outline\-bottom\-left\-radius\:/g, 'border-bottom-left-radius:'],
            [/icon\-shadow\:/g, 'text-shadow:'],
            [/textview/g, 'textarea'],
            [/\-gtk\-outline\-radius/g, 'outline-width'],
            // [/([^\.\-@#\d])\b([A-Z]\w+)\b(?!;)/g, '.$2'],
            [/\.\./g, '.'],
            [/(\w+\:\w+)(\:\w+)(\:)/g, '$1$3'],
            [/\w+\:\s[\d]+[\n]/g, '$&;'],
            [/[^\-\.|@]scrollbar/g, '*::-webkit-scrollbar,*::-webkit-scrollbar-corner'],
            [/\*::-webkit-scrollbar-corner slider/g, '*::-webkit-scrollbar-thumb'],
            [/([^\.|\-|\w|@])\bbodybody\b/g, '$1body'],
            [/\-gtk\-box\-shadow\:/g, 'box-shadow:'],
            [/\-gtk\-text\-shadow\:/g, 'text-shadow:'],
            [/\-gtk\-icon\-filter\:\s+[a-z]+/g, 'filter: blur'],
            [/\-gtk\-secondary\-caret\-color\:/g, 'caret-color:'],
            [/\-gtk\-icon\-size\:/g, 'font-size:'],
            [/\-gtk\-scaled\(/g, ''],
            [/\-gtk\-recolor\(/g, ''],
            [/\.png"\)\)/g, '.png")'],
            // Exceptions for communitheme/yaru
            [/:not\(:backdrop\):not\(:backdrop\)/g, ':not(:backdrop)'],
            [/:backdrop:backdrop/g, ':backdrop'],*/
        ];

        for (let i = 0; i < overrides.length; i++) {
            cssString = cssString.replace(...overrides[i]);
        }

        const imports = cssString.match(/(@import url\(")([\w|\-|\.|\/]+)("\))/g);
        if (imports) {
            for (let i = 0; i < imports.length; i++) {
                const cssPath = /(@import url\(")([\w|\-|\.|\/]+)("\))/g.exec(imports[i])[2];
                cssString += getCSS(cssPath, r + 1);
            }
        }

        if (r === 0) {
            cssString += '* {outline: none !important; user-select: none !important;} a {cursor: pointer;}';
        }

        return cssString;
    };

    const font = getFont();

    let css = "";
    css += `
* {
    font-family: '${font.font}', sans-serif;
    font-size: ${(font.size / 3 * 4).toFixed(6)}px;
}
`;
/*    css += `
    .titlebutton.minimize {
         background-image: url("${out.iconMap["window-minimize-symbolic"]}")
    }
    .titlebutton.maximize {
         background-image: url("${out.iconMap["window-maximize-symbolic"]}")
    }
    .titlebutton.close {
         background-image: url("${out.iconMap["window-close-symbolic"]}")
    }
    `;*/
    css += getCSS(`${theme}/${dir}/${fileName}.css`);

    // css = css.replace(/@define-color(\s[a-zA-Z_\s#\d\:;\(,\.\)]+)/g, '');

    if (process.env.NODE_ENV === 'development') {
        fs.writeFileSync(join(outputPath, 'gtk-generated.css'), css);
    }

    const result = await postgtk.process(css);
    result.css = result.css.replace(/:nth-child\(\./g, ":nth-child(");  // I don't know where introduced the weird dot after :nth-child(
    if (process.env.NODE_ENV === 'development') {
        fs.writeFileSync(join(outputPath, 'gtk-generated-converted.css'), result.css);
    }
    out.raw = result.css;
    return out;
}
