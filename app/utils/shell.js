export function isShell(p) {
    const shells = ["sh",
        "bash",
        "rbash",
        "dash",
        "zsh"];
    return shells.includes(p);
}