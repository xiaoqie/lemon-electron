// @flow
import type { Action } from './types';

export default function config(state={netBandwidth: null}, action: Action) {
    switch (action.type) {
        default:
            return state;
    }
}
