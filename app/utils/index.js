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
    const menu = window.find(".menu");
    window.css({"top": y - (menu.outerHeight(true) - menu.outerHeight())/2, "left": x - (menu.outerWidth(true) - menu.outerWidth())/2});
}

export function stringCompare(a: string, b: string): number {
    a = a.toLowerCase();
    b = b.toLowerCase();
    if (a === b) return 0;
    if (a > b) return -1;
    if (a < b) return 1;
}

