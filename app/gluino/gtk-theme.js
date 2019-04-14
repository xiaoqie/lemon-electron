import fs from 'fs';
import {homedir} from 'os';
import {execSync} from 'child_process';
import desktopEnv from 'desktop-env';
import * as path from 'path';
import SVGIcons2SVGFontStream from 'svgicons2svgfont';
import svg2ttf from 'svg2ttf';
import * as util from 'util';
import postgtk from './postcss-gtk/postcss-gtk';
import {readdirFull} from "../utils";

function getFolder(dir) {
    try {
        fs.statSync(dir);
        return dir;
    } catch (e) {
        return null;
    }
}

async function getIconMap(rootDirs) {
    const icons = rootDirs                              // .../IconTheme
        .filter(f => fs.existsSync(f))
        .map(dir => readdirFull(dir))                   // .../IconTheme/16x16
        .concatElements()
        .filter(f => fs.statSync(f).isDirectory())
        .map(d => readdirFull(d))                       // .../IconTheme/16x16/apps
        .concatElements()
        .filter(f => fs.statSync(f).isDirectory())
        .map(d => readdirFull(d))                       // .../IconTheme/16x16/apps/something.png
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
        iconMap[icon] = iconList.sort((a: string, b: string) => score(b) - score(a))[0];
    }
    return iconMap;
}

async function generateIconFont(svgs, output) {
    const fontStream = new SVGIcons2SVGFontStream({
        fontName: 'gtk-icon-theme',
        normalize: true,
        fontHeight: 1024
    });
    const pipe = fontStream.pipe(fs.createWriteStream(`${output}.svg`));
    pipe.on('error', (err) => {
        console.log(err);
    });
    for (const svg of svgs) {
        const glyph = fs.createReadStream(svg);
        const name = path.parse(svg).name.replace(/-/g, '_');
        glyph.metadata = {
            unicode: [name],
            name: name
        };
        fontStream.write(glyph);
    }
    fontStream.end();

    const onFinish = util.promisify((callback) => pipe.on('finish', callback));
    await onFinish();
    console.log('SVG Font successfully created!');
    const ttf = svg2ttf(fs.readFileSync(`${output}.svg`, 'utf8'), {});
    fs.writeFileSync(`${output}.ttf`, new Buffer(ttf.buffer));
    console.log('TTF Font successfully created!');
    // const woff = new Buffer(ttf2woff(new Uint8Array(fs.readFileSync(`${output}.ttf`)), {}).buffer);
    // fs.writeFileSync(`${output}.woff`, woff);
    // console.log('WOFF Font successfully created!');
}

async function getIconTheme(config) {
    let schema;
    const environment = await desktopEnv();
    if (environment === 'Cinnamon') {
        schema = 'org.cinnamon.desktop.interface icon-theme';
    } else {
        schema = 'org.gnome.desktop.interface icon-theme';
    }
    let iconTheme = execSync(`gsettings get ${schema}`, {encoding: 'utf8'})
        .split(`'`).join('').replace(/\n$/, '');
    const iconDirectory = '/usr/share/icons/';
    const userIconDirectory = path.join(homedir(), '.local', 'share', 'icons');
    if (iconTheme.indexOf('Mint-X') > -1) {
        iconTheme = 'Mint-X';
    }

    const iconMap = await getIconMap([
        path.join(userIconDirectory, iconTheme),
        path.join(iconDirectory, iconTheme),
        `/snap/${iconTheme.toLocaleLowerCase()}/current/share/icons/`,
        path.join(userIconDirectory, 'hicolor'),
        path.join(iconDirectory, 'hicolor'),
        path.join(config.dataDir, "icons")
    ]);

    await generateIconFont(Object.values(iconMap).filter(f => f.endsWith("symbolic.svg")),
        path.join(config.outputDir, 'gtk_icon_font'));

    return {iconMap};
}

function getFont() {
    const fontName = execSync('gsettings get org.gnome.desktop.interface font-name', {encoding: 'utf8'})
        .split("'").join('').replace(/\n$/, '');
    const parts = fontName.split(' ');
    return {font: parts.slice(0, -1).join(' '), size: parts.slice(-1)[0]};
}

export default async function getTheme(config) {
    const {dataDir, outputDir} = config;
    const environment = await desktopEnv();
    let schema: string;
    if (environment === 'Cinnamon') {
        schema = 'org.cinnamon.desktop.interface gtk-theme';
    } else {
        schema = 'org.gnome.desktop.interface gtk-theme';
    }
    const gtkTheme = execSync(`gsettings get ${schema}`, {encoding: 'utf8'});
    const themeName = gtkTheme.split(`'`).join('').replace(/\n$/, '');
    const globalTheme = getFolder(`/usr/share/themes/${themeName}`);
    const userTheme = getFolder(`${homedir()}/.themes/${themeName}`);
    const fallbackTheme = getFolder(`${dataDir}/theme/${themeName}`);
    const snapTheme = getFolder(`/snap/${themeName.toLocaleLowerCase()}/current/share/themes/${themeName}`);
    let dir = 'gtk-3.20';
    const fileName = 'gtk';
    const theme = fallbackTheme ?? snapTheme ?? userTheme ?? globalTheme;
    console.log(theme);

    const decorationLayout = execSync('gsettings get org.gnome.desktop.wm.preferences button-layout', {encoding: 'utf8'})
        .split(`'`).join('').replace(/\n$/, '');
    const arrayOfButtons = decorationLayout.split(':');
    const supportedButtons = arrayOfButtons.filter(button => button !== 'appmenu')[0].split(',');
    let buttonLayout = 'right';
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
    const iconTheme = config.iconCache ?? await getIconTheme(config);
    out.iconMap = iconTheme.iconMap;

    const getCSS = (path, r = 0) => {
        let cssString;
        try {
            cssString = fs.readFileSync(path, {encoding: 'utf8'});
        } catch (e) { // TODO: Make GTK version configurable
            cssString = fs.readFileSync(path.replace('3.20', '3.0'), {encoding: 'utf8'});
            dir = 'gtk-3.0';
            // return "";
        }
        if (cssString.indexOf('resource://') > -1) {
            console.log("fallback to ./gtk.css");
            return getCSS(path.join(dataDir, './gtk.css'), r);
        }
        const overrides = [
            [/(url\()(")/g, `$1"${theme}/${dir}/`],
            [/-gtk-icon-source:/g, `background-image:`],
            // [/(-gtk-scaled\()(.*)(\),)(.*)(\))/g, `$2)`],
            // [/(-gtk-recolor\()(.*)(\))/g, `$2`],
            // [/(image\(#)(.*)(\))/g, `linear-gradient(#$2, #$2)`],
            [/-gtk-icon-shadow:/g, `text-shadow:`],
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
                        [/:backdrop:backdrop/g, ':backdrop'], */
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

    let css = `/* stylelint-disable */`;
    css += `
@font-face {
    font-family: 'gtk-icon-theme';
    src: url('${path.join(outputDir, 'gtk_icon_font.ttf')}') format('truetype');
    font-weight: normal;
    font-style: normal;
}
.gtk-icon-theme {
    font-family: 'gtk-icon-theme';
    font-weight: normal;
    font-style: normal;
    
    /* Support for all WebKit browsers. */
    -webkit-font-smoothing: antialiased;
    /* Support for Safari and Chrome. */
    text-rendering: optimizeLegibility;
    font-variant-ligatures: common-ligatures;
    font-feature-settings: "kern";
    font-kerning: normal;
}
.titlebutton.close .gtk-icon-theme::before {
    content: "window_close_symbolic";
}
.titlebutton.minimize .gtk-icon-theme::before {
    content: "window_minimize_symbolic";
}
.titlebutton.maximize .gtk-icon-theme::before {
    content: "window_maximize_symbolic";
}
* {
    font-family: '${font.font}', sans-serif;
    font-size: ${(font.size / 3 * 4).toFixed(6)}px;
}
`;
    /* Hack for Elementary OS theme:
     * Menu has double box shadows.
     * I'm not exactly sure if this is caused by gtk's and webkit's different handling of box-shadow.
     */
    if (themeName.includes("elementary")) {
        css += `
.popup.window.csd {
    box-shadow: none;
}
        `;
    }
    css += getCSS(`${theme}/${dir}/${fileName}.css`);

    // css = css.replace(/@define-color(\s[a-zA-Z_\s#\d\:;\(,\.\)]+)/g, '');

    if (process.env.NODE_ENV === 'development') {
        fs.writeFileSync(path.join(dataDir, 'gtk-generated.css'), css);
    }

    const result = await postgtk.process(css);
    result.css = result.css.replace(/:nth-child\(\./g, ":nth-child(");  // I don't know where introduced the weird dot after :nth-child(
    if (process.env.NODE_ENV === 'development') {
        fs.writeFileSync(path.join(dataDir, 'gtk-generated-converted.css'), result.css);
    }
    out.raw = result.css;
    return out;
}
