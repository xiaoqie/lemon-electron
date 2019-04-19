import * as path from "path";
import * as fs from 'fs';
import {processLog} from "../constants/log-type";
import {GENERATE_LIST} from "./list";
import {execSync} from 'child_process';

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
    const {sys, processes, shells, lsblk} = log;
    let {systemd_units, users} = log;

    const elements = ['name', 'description', 'load', 'active', 'sub', 'following', 'objectPath', 'queued', 'jobType', 'jobObjectPath'];
    systemd_units = Object.assign(...systemd_units.map(u => ({[u[0]]: Object.assign(...u.map((v, i) => ({[elements[i]]: v})))})));
    users = Object.assign(...users.map(u => ({[u.uid]: u})));

    const isUserService = (service) => service === 'session-4.scope' || service === 'user@1000.service';
    // evaluate information, make process tree
    for (const pid in processes) {
        const p = processes[pid];
        if (p.state === "Z") { // TODO show zombie process option
            delete processes[pid];
            continue;
        }
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
        p.isShell = shells.includes(p.exe);
        p.username = users[p.uid]?.name;

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
        // const cgroupList = p.cgroup.split('/');
        // const lastCGroup = cgroupList[cgroupList.length - 1];
        // const isDaemon = regexArrayIncludes(config.knownDaemons, path.basename(p.exe)) || regexArrayIncludes(config.knownDaemons, p.comm);
        if (isUserService(p.service)) {
            p.type = 'user';
        }
        if (isUserService(p.service) && !isUserService(parent?.service)) {
            // p.type = 'gui';
            p.isGenesis = true;
            if (parent)
                delete parent.children[pid];
        }
    }

    for (const pid in processes) {
        const p = processes[pid];
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
            // p.type = 'gui';
            p.isGenesis = true;
            delete processes[p.ppid].children[pid];
        }
        if (regexArrayIncludes(config.wineApps, path.basename(p.exe))) {
            p.type = 'wine';
            p.isGenesis = true;
            delete processes[p.ppid].children[pid];
        }

        // if (isDaemon) {
        //     p.type = null;
        //     p.isGenesis = false;
        //     if (parent)
        //         parent.children[pid] = p;
        // }
    }

    // 把spawner的孩子拎出来
    for (const pid in processes) {
        const p = processes[pid];
        if (p.isSpawner) {
            for (const cpid in p.children) {
                p.children[cpid].isGenesis = true;
            }
            p.children = {};
        }
    }

    for (const line of execSync('wmctrl -lp', {encoding: 'utf-8'}).trim().split('\n')) {
        const parts = line.trim().split(/\s+/);
        const pid = parseInt(parts[2], 10);
        const title = parts.slice(4).join(' ');
        const p = processes[pid];
        if (!p) continue;
        p.window_exists = true;
        p.window_title = title;

        let parent = p;
        let i = 0;
        while (parent && parent.isGenesis === false && i < 10) {
            parent = processes[parent.ppid];
            i++;
        }
        if (parent) parent.type = 'gui';
    }


    // service grouping
    for (const pid in processes) {
        const p = processes[pid];
        if (p.isGenesis && p.service && systemd_units[p.service] && !isUserService(p.service)) {
            if (!(p.service in processes)) {
                const dummyProc = processLog();
                dummyProc.pid = p.service;
                dummyProc.cmdline = p.service;
                dummyProc.description = systemd_units[p.service].description;
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
            // p.children = flatten(p);
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


    const newGroup = (name, id) => {
        const p = processLog();
        p.cmdline = name;
        p.type = 'group';
        p.pid = id;
        return p;
    };

    // grouping
    processes.gui = newGroup("GUI_Applications", 'gui');
    processes.terminal = newGroup('Terminals', 'terminal');
    processes.wine = newGroup('Wine', 'wine');
    processes.user = newGroup('Processes', 'user');
    processes.service = newGroup('Services', 'service');
    processes.other = newGroup('Root_Processes', 'other');

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
            } else if (p.type === 'service') {
                p.isGenesis = false;
                processes.service.children[pid] = p;
            } else if (p.type === 'user') {
                p.isGenesis = false;
                processes.user.children[pid] = p;
            } else {
                p.isGenesis = false;
                processes.other.children[pid] = p;
            }
        }
    }
    processes.gui.isGenesis = true;
    processes.wine.isGenesis = true;
    processes.service.isGenesis = true;
    processes.terminal.isGenesis = true;
    processes.other.isGenesis = true;
    processes.user.isGenesis = true;

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
        payload: {...getState(), log: processedLog}
    });
};
