export function formatBytes(bytes, digits) {
    // if (bytes < 1024) return bytes + " Bytes";
    if (bytes < 1048576) return (bytes / 1024).toFixed(digits) + " KiB";
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(digits) + " MiB";
    return (bytes / 1073741824).toFixed(digits) + " GiB";
}

export const calcIntensity = (value, max) => Math.tanh(0.1 + value / max * 2);
