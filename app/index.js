import React from 'react';
import {render} from 'react-dom';
import {AppContainer} from 'react-hot-loader';
import Root from './containers/Root';
import {configureStore, history} from './store/configureStore';
import './app.global.scss';
import * as websocket from './utils/websocket';
import {receiveLog} from "./actions/log";

import getTheme from './electron-gtk-theme'
getTheme({
    outputPath: __dirname + "/gtk-theme"
});


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
    },
    config: {
        netBandwidth: 100 * 1024 * 1024 / 8
    }
});

const port = 8089;
websocket.connect(`ws://127.0.0.1:${port}`, log => {
    const scroll = document.documentElement.scrollTop;
    store.dispatch(receiveLog(log));
    document.documentElement.scrollTop = scroll;
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
