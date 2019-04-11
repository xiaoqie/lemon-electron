// @flow
import {RECEIVE_LOG} from "../actions/log";
import type { Action } from './types';

export default function log(state={}, action: Action) {
    switch (action.type) {
        case RECEIVE_LOG:
            return action.payload.log;
        default:
            return state;
    }
}
