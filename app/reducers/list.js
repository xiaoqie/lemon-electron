// @flow
import {LIST_RESIZE, LIST_SELECT, LIST_SORT} from "../actions/list";
import type { Action } from './types';

export default function list(state={sort: {}, layout: {}, currentSelection: null}, action: Action) {
    switch (action.type) {
        case LIST_SORT:
            return {
                ...state,
                sort: action.payload
            };
        case LIST_RESIZE:
            return {
                ...state,
                layout: action.payload
            };
        case LIST_SELECT:
            return {
                ...state,
                currentSelection: action.payload
            };
        default:
            return state;
    }
}
