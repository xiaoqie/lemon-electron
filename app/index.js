import React from 'react';
import {render} from 'react-dom';
import {AppContainer} from 'react-hot-loader';
import Root from './containers/Root';
import {configureStore, history} from './store/configureStore';
import './app.global.scss';
import * as websocket from './utils/websocket';
import {receiveLog} from "./actions/log";
import './utils/import-gtk-theme';

const store = configureStore({
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
            "(systemd)"
        ],
        "guiSpawners":
            [
                "(gnome-shell)"
            ],
        "wineApps":
            [
                "wine-preloader",
                "wineserver.real"
            ]
    }
});

const port = 8089;
websocket.connect(`ws://127.0.0.1:${port}`, log => {
    store.dispatch(receiveLog(log));
    // global.gc();
});

render(
    <AppContainer>
        <Root store={store} history={history}/>
    </AppContainer>,
    document.getElementById('root')
);

if (module.hot) {
    module.hot.accept('./containers/Root', () => {
        // eslint-disable-next-line global-require
        const NextRoot = require('./containers/Root').default;
        render(
            <AppContainer>
                <NextRoot store={store} history={history}/>
            </AppContainer>,
            document.getElementById('root')
        );
    });
}
