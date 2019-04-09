import type { GetState, Dispatch } from '../reducers/types';
import {getDisplayName} from "../utils/name";
import {stringCompare} from "../utils";

export const LIST_SORT = "LIST_SORT";
export const LIST_RESIZE = "LIST_RESIZE";
export const LIST_SELECT = "LIST_SELECT";
export const GENERATE_LIST = "GENERATE_LIST";

export function generateList(processes, sort) {
    const listItems = [];
    const {col, reverse} = sort;
    const appendList = (items) => {
        let pids = Object.keys(items);
        if (Object.keys(items).length === 0) {
            return;
        }
        if (items[pids[0]].type !== 'group') {
            switch (col) {
                case "name":
                    pids = pids.sort((pid1, pid2) =>
                        (reverse ? -1 : 1) * stringCompare(getDisplayName(items[pid1]), getDisplayName(items[pid2])));
                    break;
                case "pid":
                    pids = pids.sort((pid1, pid2) =>
                        (reverse ? -1 : 1) * (pid2 - pid1));
                    break;
                case "cpu":
                    pids = pids.sort((pid1, pid2) =>
                        (reverse ? -1 : 1) * (items[pid1].cpu_usage - items[pid2].cpu_usage));
                    break;
                case "mem":
                    pids = pids.sort((pid1, pid2) =>
                        (reverse ? -1 : 1) * (items[pid1].mem - items[pid2].mem));
                    break;
                case "disk":
                    pids = pids.sort((pid1, pid2) =>
                        (reverse ? -1 : 1) * (items[pid1].disk_total - items[pid2].disk_total));
                    break;
                case "net":
                    pids = pids.sort((pid1, pid2) =>
                        (reverse ? -1 : 1) * (items[pid1].net_total - items[pid2].net_total));
                    break;
                case "gpu-usage":
                    pids = pids.sort((pid1, pid2) =>
                        (reverse ? -1 : 1) * (items[pid1].gpu_usage_total - items[pid2].gpu_usage_total));
                    break;
                case "gpu-mem":
                    pids = pids.sort((pid1, pid2) =>
                        (reverse ? -1 : 1) * (items[pid1].gpu_memory_used - items[pid2].gpu_memory_used));
                    break;
                default:
                    break;
            }
        }
        for (const pid of pids) {
            const process = items[pid];
            const item = {};
            item.arrow = false;
            item.icon = "";
            item.name = getDisplayName(process);
            listItems.push(item);

            const expanded = process.type === 'group';
            if (Object.keys(process.children) !== 0 && expanded) {
                appendList(process.children);
            }
        }
    };
    appendList(Object.assign(...Object.keys(processes).filter(pid => processes[pid].isGenesis).map(pid => ({[pid]: processes[pid]}))));
    return listItems;
}

export const listSortClick = newCol => (dispatch: Dispatch, getState: GetState) => {
    const {list} = getState();
    const {sort} = list;
    const {col, reverse} = sort;
    if (col !== newCol) {
        dispatch({
            type: LIST_SORT,
            payload: {
                col: newCol,
                reverse: true
            }
        });
    } else {
        dispatch({
            type: LIST_SORT,
            payload: {
                col: newCol,
                reverse: !reverse
            }
        });
    }
};

export const listColResize = (i, width) => (dispatch: Dispatch, getState: GetState) => {
    const {list} = getState();
    const {layout} = list;

    const l = JSON.parse(JSON.stringify(layout));
    l[i].width = width;

    dispatch({
        type: LIST_RESIZE,
        payload: l
    })
};

export const listSelect = pid => dispatch => {
    dispatch({
        type: LIST_SELECT,
        payload: pid
    })
}

