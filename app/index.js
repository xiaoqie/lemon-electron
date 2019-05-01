import React from 'react';
import {render} from 'react-dom';
import {AppContainer} from 'react-hot-loader';
import {ipcRenderer} from 'electron';
import Root from './containers/Root';
import {configureStore, history} from './store/configureStore';
import './app.global.scss';
import * as websocket from './utils/websocket';
import * as LogAction from "./actions/log";
import './utils/import-gtk-theme';
import initialState from './constants/initial-state';

const store = configureStore(initialState);

const port = 8089;
websocket.connect(`ws://127.0.0.1:${port}`, log => {
    store.dispatch(LogAction.receiveLog(LogAction.process(log, initialState.config)));
});
/*ipcRenderer.on("log", (event, log) => {
    store.dispatch(LogAction.receiveLog(log));
});*/

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
