// @flow
import {GENERATE_LIST, generateList, LIST_RESIZE, LIST_SELECT, LIST_SORT} from "../actions/list";
import type { Action } from './types';
import {RECEIVE_LOG} from "../actions/log";

export default function list(state={listItems: [], sort: {}, layout: {}, currentSelection: null}, action: Action) {
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
        case GENERATE_LIST: {
            const {log, config, list} = action.payload;
            const {processes} = log;
            const {sort} = list;
            const listItems = generateList(processes, sort);
            console.log(listItems);
            return {
                ...state,
                listItems: listItems
            };
        }
        default:
            return state;
    }
}
