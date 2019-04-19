import * as path from 'path';
import type { GetState, Dispatch } from '../reducers/types';
import {getDisplayName} from "../utils/name";
import {formatBytes, stringCompare} from "../utils";
import * as gnome from "../utils/gnome";

export const LIST_SORT = "LIST_SORT";
export const LIST_RESIZE = "LIST_RESIZE";
export const LIST_SELECT = "LIST_SELECT";
export const LIST_UNCOLLAPSE = "LIST_UNCOLLAPSE";
export const LIST_SCROLL = "LIST_SCROLL";
export const LIST_VIEWPORT_RESIZE = "LIST_VIEWPORT_RESIE"

export function generateList(processes, sort, expanded) {
    if (!processes) return [];
    const listItems = [];
    const {col, reverse} = sort;
    const appendList = (items, depth=0) => {
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
            item.depth = depth  - 1;
            item.cmdline = process.cmdline;
            item.icon = gnome.getIconURL(process);
            item.name = getDisplayName(process);
            item.pid = process.pid;
            item.selectable = process.type !== 'group';
            if (process.type !== 'group') {
                item.collapsable = Object.keys(process.children).length !== 0;
                if (process.type !== 'service') {
                    item.displayPid = process.pid;
                } else {
                    item.description = process.description;
                }
                if (process.type === 'gui') {
                    item.description = gnome.getDescription(process);
                }
                if (process.type === 'terminal') {
                    item.name += ` [@.../${path.basename(process.cwd)}]`
                }
                item.username = process.username;
                item.cpu = `${(process.cpu_usage / 4 * 100.0).toFixed(0)}%`; // FIXME count cpu cores
                item.mem = formatBytes(process.mem, 1);
                item.disk = `${formatBytes(process.disk_total, 1)}/s`;
                item.net = `${formatBytes(process.net_total, 1)}/s`;
                item.gpu = `${(process.gpu_usage_total * 100).toFixed(0)}%`;
                item.vram = formatBytes(process.gpu_memory_used, 1);
            } else {
                item.icon = 'none';
                item.depth += 1;
                item.collapsable = false;
            }
            item.expanded = expanded && expanded.includes(process.pid);
            if (process.type !== 'group' || Object.keys(process.children).length !== 0) {
                listItems.push(item);
            }

            const isExpanded = process.type === 'group' || item.expanded;
            if (Object.keys(process.children) !== 0 && isExpanded) {
                appendList(process.children, depth + 1);
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
                reverse: true,
                allState: getState()
            }
        });
    } else {
        dispatch({
            type: LIST_SORT,
            payload: {
                col: newCol,
                reverse: !reverse,
                allState: getState()
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
};

export const listUncollapse = pid => (dispatch: Dispatch, getState: GetState) => {
    dispatch({
        type: LIST_UNCOLLAPSE,
        payload: {
            pid: pid,
            allState: getState()
        }
    })
};

export const listScroll = scroll => (dispatch: Dispatch) => {
    dispatch({
        type: LIST_SCROLL,
        payload: scroll
    })
};

export const listViewportResize = height => (dispatch: Dispatch) => {
    dispatch({
        type: LIST_VIEWPORT_RESIZE,
        payload: height
    })
}
