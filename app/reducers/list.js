// @flow
import {GENERATE_LIST, generateList, LIST_RESIZE, LIST_SELECT, LIST_SORT, LIST_UNCOLLAPSE} from "../actions/list";
import type { Action } from './types';
import {RECEIVE_LOG} from "../actions/log";

function onGenerateList(allState) {
    return generateList(allState.log.processes, allState.list.sort, allState.list.expanded);
}

export default function list(state={listItems: [], sort: {}, layout: {}, currentSelection: null, expanded: []}, action: Action) {
    switch (action.type) {
        case LIST_SORT: {
            const {allState} = action.payload;
            return {
                ...state,
                sort: action.payload,
                listItems: generateList(allState.log.processes, action.payload, allState.list.expanded)
            };
        }
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
        case RECEIVE_LOG: {
            return {
                ...state,
                listItems: onGenerateList(action.payload)
            };
        }
        case LIST_UNCOLLAPSE: {
            const {pid, allState} = action.payload;
            let expanded = [...state.expanded];
            if (expanded.includes(pid)) {
                expanded = expanded.filter(p => p !== pid);
            } else {
                expanded.push(pid);
            }
            return {
                ...state,
                expanded: expanded,
                listItems: generateList(allState.log.processes, allState.list.sort, expanded)
            }
        }
        default:
            return state;
    }
}
