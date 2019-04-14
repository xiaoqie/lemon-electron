import * as fs from 'fs';
import * as path from 'path';

export function formatBytes(bytes, digits) {
    // if (bytes < 1024) return bytes + " Bytes";
    if (bytes < 1048576) return (bytes / 1024).toFixed(digits) + " KiB";
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(digits) + " MiB";
    return (bytes / 1073741824).toFixed(digits) + " GiB";
}

export const calcIntensity = (value, max) => Math.tanh(0.1 + value / max * 2);

export function C(...classNames) {
    return classNames.join(' ');
}

export function moveMenuWindowTo(window, {x, y}) {
    const $ = require('jquery');
    const menu = window.find(".menu");
    const maxX = Math.max(0, $(document).outerWidth() - $(menu).outerWidth() - 32);
    const maxY = Math.max(0, $(document).outerHeight() - $(menu).outerHeight() - 32);

    window.css({
        "top": Math.min(maxY, y - (menu.outerHeight(true) - menu.outerHeight()) / 2),
        "left": Math.min(maxX, x - (menu.outerWidth(true) - menu.outerWidth()) / 2)
    });
}

export function stringCompare(a: string, b: string): number {
    a = a.toLowerCase();
    b = b.toLowerCase();
    if (a === b) return 0;
    if (a > b) return -1;
    if (a < b) return 1;
}

export function readdirFull(dir) {
    return fs.readdirSync(dir).map(f => path.join(dir, f));
}

Array.prototype.concatElements = function concatElements() {
    return [].concat.apply([], this);
};
Array.prototype.mapAsync = async function mapAsync(func) {
    return Promise.all(this.map(func));
};

