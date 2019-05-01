export default {
    list: {
        sort: {col: "mem", reverse: true},
        layout: [
            {col: "name", width: 300},
            {col: "pid", width: 80},
            {col: "cpu", width: 80},
            {col: "mem", width: 100},
            {col: "disk", width: 100},
            {col: "net", width: 100},
            {col: "gpu-usage", width: 80},
            {col: "gpu-mem", width: 100},
        ],
        listItems: [], currentSelection: null, expanded: [],
        scroll: 0, viewportHeight: 1080 //  I don't know, maybe higher value and viewportWidth?
    },
    config: {
        netBandwidth: 100 * 1024 * 1024 / 8,
        "knownDaemons": [
            ".*\\.AppImage",  // suffix isn't a reliable way to identify file type
            "flatpak-dbus-proxy",
            "bwrap",
            // Ubuntu GNOME:
            "dbus-daemon",
            "dbus-launch",
            "pulseaudio",
            "gnome-keyring-daemon",
            "dconf-service",
            "goa-daemon",
            "gsd-printer",
            "gconfd-2",
            "goa-identity-service",
            "gnome-shell-calendar-server",
            "tumblerd",
            "gdm-session-worker",
            "gvfs.*",

            // Elementary OS:
            "io.elementary.files-daemon",
            "contractor",

            // Others:
            "fcitx-dbus-watcher",
            "sogou-qimpanel-watchdog"
        ],
        "knownApps": [
            "gnome-software"
        ],
        "terminalApps": [
            "io.elementary.terminal",
            "gnome-terminal-server"
        ],
        "spawners": [
            "(gdm3)",
            "(systemd)",
        ],
        "guiSpawners": [
            "(gnome-shell)",
            // "(bwrap)"  // I don't think we can be sure if bwrap wraps a gui app
        ],
        "wineApps": [
            "wine-preloader",
            "wineserver.real"
        ]
    }
};