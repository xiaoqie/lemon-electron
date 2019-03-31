// @flow
import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import counter from './counter';
import log from "./log";
import list from "./list";
import config from "./config";

export default function createRootReducer(history: History) {
  return combineReducers({
    router: connectRouter(history),
    counter: counter,
    log: log,
    list: list,
    config: config
  });
}
