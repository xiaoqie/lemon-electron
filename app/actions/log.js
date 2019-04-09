import * as path from "path";
import * as fs from 'fs';
import {processLog} from "../constants/log-type";
import {GENERATE_LIST} from "./list";

export const RECEIVE_LOG = "RECEIVE_LOG";

function cumsum(obj, field) { /* eslint-disable no-param-reassign */
    if (!obj.children) {
        return obj[field];
    }
    let sum = obj[field];
    for (const pid in obj.children) {
        sum += cumsum(obj.children[pid], field);
    }
    obj[field] = sum;
    return sum;
}

function flatten(obj) {
    const result = {...obj.children, ...Object.values(obj.children).reduce((acc, val) => ({...acc, ...flatten(val)}), {})};
    obj.children = {};
    return result;
}

function regexArrayIncludes(regexes, str) {
    for (const r of regexes) {
        const regex = RegExp(r);
        if (regex.test(str))
            return true;
    }
    return false;
}

function process(log, config) {
    const {sys, processes, users, shells, lsblk} = log;
    let {systemd_units} = log;

    const elements = ['name', 'description', 'load', 'active', 'sub', 'following', 'objectPath', 'queued', 'jobType', 'jobObjectPath'];
    systemd_units = Object.assign(...systemd_units.map(u => ({[u[0]]: Object.assign(...u.map((v, i) => ({[elements[i]]: v})))})));

    // evaluate information, make process tree
    for (const pid in processes) {
        const p = processes[pid];
        const cgroupList = p.cgroup.split('/');
        if (p.cgroup === '/') {
            p.service = "";
        } else if (cgroupList[1] === 'system.slice') {
            p.service = cgroupList[2];
        } else {
            p.service = cgroupList[3];
        }
        p.gpu_usage_total = Math.max(p.nv_enc_usage, p.nv_mem_usage, p.nv_sm_usage, p.nv_dec_usage);
        p.disk_total = p.disk_read + p.disk_write;
        p.net_total = p.net_send + p.net_receive;
        p.isSpawner = false;

        if (!p.children) {
            p.children = {};
        }
        if (processes[p.ppid]) {
            p.isGenesis = false;

            if (!processes[p.ppid].children) {
                processes[p.ppid].children = {};
            }
            processes[p.ppid].children[pid] = p;
        } else {
            p.isGenesis = true;
        }
    }

    for (const pid in processes) {
        const p = processes[pid];
        const parent = processes[p.ppid];
        const cgroupList = p.cgroup.split('/');
        const lastCGroup = cgroupList[cgroupList.length - 1];
        if (regexArrayIncludes(config.spawners, p.comm)) {
            p.isSpawner = true;
        }
        if (regexArrayIncludes(config.guiSpawners, p.comm)) {
            p.isSpawner = true;
            for (const cpid in p.children) {
                p.children[cpid].type = 'gui';
            }
        }
        if (regexArrayIncludes(config.terminalApps, path.basename(p.exe))) {
            p.isSpawner = true;
            for (const cpid in p.children) {
                p.children[cpid].type = 'terminal';
            }
        }
        if (regexArrayIncludes(config.knownApps, path.basename(p.exe))) {
            p.type = 'gui';
            p.isGenesis = true;
            delete processes[p.ppid].children[pid];
        }
        if (regexArrayIncludes(config.wineApps, path.basename(p.exe))) {
            p.type = 'wine';
            p.isGenesis = true;
            delete processes[p.ppid].children[pid];
        }

        if (p.type !== 'terminal' && p.type !== 'wine' &&
            !(
                regexArrayIncludes(config.knownDaemons, path.basename(p.exe)) ||
                regexArrayIncludes(config.knownDaemons, p.comm)
            ) &&
            (
                (p.service === 'session-4.scope' && parent?.service !== 'session-4.scope') ||
                (p.service === 'user@1000.service' && parent?.service !== 'user@1000.service' &&
                    (lastCGroup === 'dbus.service' || lastCGroup === 'gnome-terminal-server.service')) // TODO better conditioning
            )) {
            p.type = 'gui';
            p.isGenesis = true;
            if (parent)
                delete parent.children[pid];
        }
    }

    // 把spawner的孩子拎出来
    for (const pid in processes) {
        const p = processes[pid];
        if (p.isSpawner) {
            for (const cpid in p.children) {
                if (p.children[cpid].state !== "Z") // TODO more zombie detections
                    p.children[cpid].isGenesis = true;
            }
            p.children = {};
        }
    }

    // service grouping
    for (const pid in processes) {
        const p = processes[pid];
        if (p.isGenesis && p.service && p.type !== "gui" && p.type !== "terminal" && p.type !== "wine") {
            if (!(p.service in processes)) {
                const dummyProc = processLog();
                dummyProc.pid = p.service;
                dummyProc.cmdline = p.service;
                if (systemd_units[p.service])
                    dummyProc.comm = systemd_units[p.service].description;
                dummyProc.isGenesis = true;
                dummyProc.type = 'service';
                dummyProc.service = p.service;
                processes[p.service] = dummyProc;
            }
            processes[p.service].children[pid] = p;
            p.isGenesis = false;
        }
    }
    // FIXME where to flatten?
    for (const pid in processes) {
        const p = processes[pid];
        if (p.isGenesis && p.type !== 'group') {
            p.children = flatten(p);
        }
    }
    // cumsum
    for (const pid in processes) {
        const p = processes[pid];
        if (p.isGenesis) {
            cumsum(p, "cpu_usage");

            cumsum(p, "mem");
            cumsum(p, "resident_mem");
            cumsum(p, "virtual_mem");
            cumsum(p, "shared_mem");

            cumsum(p, "net_receive");
            cumsum(p, "net_send");
            cumsum(p, "net_total");

            cumsum(p, "disk_read");
            cumsum(p, "disk_write");
            cumsum(p, "disk_total");

            cumsum(p, "gpu_memory_used");
            cumsum(p, "nv_dec_usage");
            cumsum(p, "nv_enc_usage");
            cumsum(p, "nv_mem_usage");
            cumsum(p, "nv_sm_usage");
            cumsum(p, "nv_type");
            cumsum(p, "gpu_usage_total");
        }
    }

    // grouping
    processes.gui = processLog();
    processes.gui.cmdline = 'Applications';
    processes.gui.type = 'group';
    processes.gui.pid = 'gui';

    processes.terminal = processLog();
    processes.terminal.cmdline = 'Terminals';
    processes.terminal.type = 'group';
    processes.terminal.pid = 'terminal';

    processes.wine = processLog();
    processes.wine.cmdline = 'Wine';
    processes.wine.type = 'group';
    processes.wine.pid = 'wine';

    processes.service = processLog();
    processes.service.cmdline = 'Services';
    processes.service.type = 'group';
    processes.service.pid = 'service';
    for (const pid in processes) {
        const p = processes[pid];
        if (p.isGenesis && p.type !== 'group') {
            if (p.type === 'gui') {
                p.isGenesis = false;
                processes.gui.children[pid] = p;
            } else if (p.type === 'terminal') {
                p.isGenesis = false;
                processes.terminal.children[pid] = p;
            } else if (p.type === "wine") {
                p.isGenesis = false;
                processes.wine.children[pid] = p;
            } else {
                p.isGenesis = false;
                processes.service.children[pid] = p;
            }
        }
    }
    processes.gui.isGenesis = true;
    processes.wine.isGenesis = true;
    processes.service.isGenesis = true;
    processes.terminal.isGenesis = true;

    const parentsChildrenDict = {};
    const retrieveChildren = (obj) => {
        const result = [...Object.keys(obj.children), ...Object.values(obj.children).reduce((acc, val) => ([...acc, ...retrieveChildren(val)]), [])];
        if (!parentsChildrenDict[obj.pid]) {
            parentsChildrenDict[obj.pid] = {children: [], parents: []};
        }
        parentsChildrenDict[obj.pid.toString()].children = result;
        return result;
    };
    for (const pid in processes) {
        if (processes[pid].isGenesis)
            retrieveChildren(processes[pid]);
    }
    for (const pid in parentsChildrenDict) {
        for (const cpid of parentsChildrenDict[pid].children) {
            parentsChildrenDict[cpid].parents.push(pid);
        }
    }

    return {sys, processes, systemd_units, users, shells, lsblk, parentsChildrenDict};
}

export const receiveLog = log => (dispatch, getState) => {
    const processedLog = Object.keys(log).length !== 0 ? process(log, getState().config) : {};
    dispatch({
        type: RECEIVE_LOG,
        payload: processedLog
    });
    dispatch({
        type: GENERATE_LIST,
        payload: getState()
    });
};
