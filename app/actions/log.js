import * as path from "path";
import * as fs from 'fs';
import {processLog} from "../constants/log-type";

export const RECEIVE_LOG = "RECEIVE_LOG";

const {knownDaemons, terminalApps} = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'dist/config.json')));

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

function process(log) {
    let {sys, processes, systemd_units, users, shells} = log;
    const elements = ['name', 'description', 'load', 'active', 'sub', 'following', 'objectPath', 'queued', 'jobType', 'jobObjectPath'];
    systemd_units = Object.assign(...systemd_units.map(u => ({[u[0]]: Object.assign(...u.map((v, i) => ({[elements[i]]: v})))})));
    // evaluate information, make process tree
    for (const pid in processes) if (Object.prototype.hasOwnProperty.call(processes, pid)) {
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

    for (const pid in processes) if (Object.prototype.hasOwnProperty.call(processes, pid)) {
        const p = processes[pid];
        if (p.comm === "(systemd)") {
            p.isSpawner = true;
        }
        if (p.comm === "(gnome-shell)") {
            p.isSpawner = true;
            for (const cpid in p.children) {
                p.children[cpid].type = 'gui';
            }
        }
        if (terminalApps.includes(path.basename(p.exe))) {
            p.isSpawner = true;
            for (const cpid in p.children) {
                p.children[cpid].type = 'terminal';
            }
        }
        const GUIs = [];
        if (GUIs.includes(path.basename(p.exe))) {
            p.type = 'gui';
            p.isGenesis = true;
            delete processes[p.ppid].children[pid];
        }
    }

    // 把spawner的孩子拎出来
    for (const pid in processes) if (Object.prototype.hasOwnProperty.call(processes, pid)) {
        const p = processes[pid];
        if (p.isSpawner) {
            for (const cpid in p.children) {
                p.children[cpid].isGenesis = true;
            }
            p.children = {};
        }
    }
    for (const pid in processes) if (Object.prototype.hasOwnProperty.call(processes, pid)) {
        const p = processes[pid];
        const parent = processes[p.ppid];
        const cgroupList = p.cgroup.split('/');
        const lastCGroup = cgroupList[cgroupList.length - 1];
        if (p.isGenesis && p.type !== 'terminal' &&
            !(knownDaemons.includes(path.basename(p.exe)) || knownDaemons.includes(p.comm)) &&
            (
                p.service === 'session-4.scope' ||
                (p.service === 'user@1000.service' &&
                    (lastCGroup === 'dbus.service' || lastCGroup === 'gnome-terminal-server.service'))
            )) {
            p.type = 'gui';
            p.isGenesis = true;
            if (parent)
                delete parent.children[pid];
        }
    }

    // service grouping
    for (const pid in processes) if (Object.prototype.hasOwnProperty.call(processes, pid)) {
        const p = processes[pid];
        if (p.isGenesis && p.service && p.type !== "gui" && p.type !== "terminal") {
            if (!(p.service in processes)) {
                const dummyProc = processLog();
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
    for (const pid in processes) if (Object.prototype.hasOwnProperty.call(processes, pid)) {
        const p = processes[pid];
        if (p.isGenesis && p.type !== 'group') {
            p.children = flatten(p);
        }
    }
    // cumsum
    for (const pid in processes) if (Object.prototype.hasOwnProperty.call(processes, pid)) {
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

    processes.terminal = processLog();
    processes.terminal.cmdline = 'Terminals';
    processes.terminal.type = 'group';

    processes.service = processLog();
    processes.service.cmdline = 'Services';
    processes.service.type = 'group';
    for (const pid in processes) if (Object.prototype.hasOwnProperty.call(processes, pid)) {
        const p = processes[pid];
        if (p.isGenesis && p.type !== 'group') {
            if (p.type === 'gui') {
                p.isGenesis = false;
                processes.gui.children[pid] = p;
            } else if (p.type === 'terminal') {
                p.isGenesis = false;
                processes.terminal.children[pid] = p;
            } else {
                p.isGenesis = false;
                processes.service.children[pid] = p;
            }
        }
    }
    processes.gui.isGenesis = true;
    processes.service.isGenesis = true;
    processes.terminal.isGenesis = true;

    // filter out non-genesis processes to pass to <List>
    for (const pid in processes) if (Object.prototype.hasOwnProperty.call(processes, pid)) {
        const p = processes[pid];
        if (!p.isGenesis) {
            delete processes[pid];
        }
    }
    return {sys, processes, systemd_units, users, shells};
}

export const receiveLog = log => dispatch => {
    dispatch({
        type: RECEIVE_LOG,
        payload: process(log)
    });
};
