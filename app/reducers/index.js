// @flow
import { combineReducers } from 'redux';
import { connectRouter } from 'connected-react-router';
import log from "./log";
import list from "./list";
import config from "./config";

export default function createRootReducer(history: History) {
  return combineReducers({
    router: connectRouter(history),
    log: log,
    list: list,
    config: config
  });
}
