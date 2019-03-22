// @flow
import React, {Component} from 'react';
import {spawn} from "child_process";
import List from "./List";
import ListHeader from "./ListHeader";
import {getGnomeIcons} from "../utils/gnome"
import * as systemd from "../utils/systemd"

type Props = {};

interface SystemLog {
    MemAvailable: number,
    MemTotal: number,
    SwapFree: number,
    SwapTotal: number,
    cpus: Object,
    gpu_fan_speed: number,
    gpu_graphics_clock: number,
    gpu_mem_clock: number,
    gpu_memory_free: number,
    gpu_memory_total: number,
    gpu_name: string,
    gpu_power_draw: number,
    gpu_power_limit: number,
    gpu_shared_memory_free: number,
    gpu_shared_memory_total: number,
    gpu_sm_clock: number,
    gpu_temp: number,
    gpu_video_clock: number,
    nv_dec_usage: number,
    nv_enc_usage: number,
    nv_gpu_usage: number,
    nv_mem_usage: number
}

interface ProcessLog {
    children: Object,
    cmdline: string,
    comm: string,
    cpu_usage: number,
    disk_read: number,
    disk_write: number,
    gpu_memory_used: number,
    mem: number,
    net_receive: number,
    net_send: number,
    nv_dec_usage: number,
    nv_enc_usage: number,
    nv_mem_usage: number,
    nv_sm_usage: number,
    nv_type: string,
    ppid: number,
    resident_mem: number,
    service: string,
    shared_mem: number,
    virtual_mem: number,
    // not in raw format
    disk_total: number,
    gpu_usage_total: number,
    isGenesis: boolean,
    isSpawner: boolean,
    net_total: number,
    isGUI: boolean,
    isTerminal: boolean,
    type: string,
    cgroup: string
}

function newProcessLog() {
    return {
        children: {},
        cmdline: "",
        comm: "",
        cpu_usage: 0,
        disk_read: 0,
        disk_write: 0,
        gpu_memory_used: 0,
        mem: 0,
        net_receive: 0,
        net_send: 0,
        nv_dec_usage: 0,
        nv_enc_usage: 0,
        nv_mem_usage: 0,
        nv_sm_usage: 0,
        nv_type: "",
        ppid: 0,
        resident_mem: 0,
        service: "",
        shared_mem: 0,
        virtual_mem: 0,
        disk_total: 0,
        gpu_usage_total: 0,
        isGenesis: false,
        isSpawner: false,
        net_total: 0,
        isGUI: false,
        isTerminal: false,
        type: "",
        cgroup: ""
    }
}

interface Log {
    sys: SystemLog,
    proc: Array<ProcessLog>
}

function cumsum(obj, field) {
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

export default class Home extends Component<Props> {
    props: Props;

    constructor() {
        super();
        this.state = {
            log: {},
            layout: [
                {col: "name", width: 400},
                {col: "pid", width: 50},
                {col: "cpu", width: 50},
                {col: "mem", width: 100},
                {col: "disk", width: 100},
                {col: "net", width: 100},
                {col: "gpu-usage", width: 50},
                {col: "gpu-mem", width: 100},
            ],
            config: {
                sort: "mem",
                reverseOrder: true
            }
        };
    }

    async componentDidMount() {
        this.execute('/home/xiaoq/workspace/lemond/cmake-build-debug/lemond', async (output) => {
            const scroll = document.documentElement.scrollTop;
            const log: Log = JSON.parse(output);
            // TODO: check systemd availability, this should be done in `lemond`
            /*            const units = await systemd.fetchUnits(log.proc);
                        for (const pid in units) {
                            log.proc[pid].service = units[pid];
                        }*/
            this.setState({log: log});
            document.documentElement.scrollTop = scroll;
        });
    }

    componentWillUnmount(): void {
        console.log("try to kill daemon");
        this.cmd.kill();
    }


    cmd;

    execute(command, callback) {
        console.log("try to start daemon");
        this.cmd = spawn(command);
        let line = "";
        this.cmd.stdout.on('data', (data) => {
            const d = data.toString();
            line += d;
            if (d.substr(d.length - 1) === "\n") {
                callback(line);
                line = "";
            }
        });
    }

    sortClickHandler(col) {
        const {config} = this.state;
        const {sort, reverseOrder} = config;
        if (sort !== col) {
            this.setState({config: {...config, sort: col, reverseOrder: true}})
        } else {
            this.setState({config: {...config, reverseOrder: !reverseOrder}})
        }
    }

    setLayoutHandler(l) {
        this.setState({layout: l});
    }

    render() {
        const {log, layout, config} = this.state;
        let {sys, proc} = log;
        if (!proc) {
            return (<div>Loading...</div>);
        }
        proc = JSON.parse(JSON.stringify(proc));

        for (const pid in proc) {
            const p = proc[pid];
            const cgroupList = p.cgroup.split('/');
            if (p.cgroup === '/') {
                p.service = "";
            } else if (cgroupList[1] === 'system.slice') {
                p.service = cgroupList[2];
            } else {
                p.service = cgroupList[3];
            }
            p.gpu_usage_total = p.nv_enc_usage + p.nv_mem_usage + p.nv_sm_usage + p.nv_dec_usage;
            p.disk_total = p.disk_read + p.disk_write;
            p.net_total = p.net_send + p.net_receive;
            p.isSpawner = false;
            if (!p.children) {
                p.children = {};
            }
            if (proc[p.ppid]) {
                p.isGenesis = false;

                if (!proc[p.ppid].children) {
                    proc[p.ppid].children = {};
                }
                proc[p.ppid].children[pid] = p;
            } else {
                p.isGenesis = true;
            }
        }

        /*        for (const pid in proc) {
                    const p = proc[pid];
                    const parent = proc[p.ppid];
                    if (p.service && p.service.startsWith('session-') && p.service.endsWith('.scope') && parent.service !== p.service) {
                        p.isGenesis = true;
                        delete parent.children[pid];
                    }
                }*/

        for (const pid in proc) {
            const p = proc[pid];
            if (p.comm === "(systemd)") {
                p.isSpawner = true;
            }
            if (p.comm === "(gnome-shell)") {
                p.isSpawner = true;
                for (const cpid in proc[pid].children) {
                    proc[pid].children[cpid].isGUI = true;
                    proc[pid].children[cpid].type = 'gui';
                }
            }
            const GUIs = [];
            if (GUIs.includes(p.comm)) {
                p.isGUI = true;
                p.type = 'gui';
                p.isGenesis = true;
                delete proc[p.ppid].children[pid];
            }
        }

        for (const pid in proc) {
            if (proc[pid].isSpawner) {
                for (const cpid in proc[pid].children) {
                    proc[pid].children[cpid].isGenesis = true;
                }
                proc[pid].children = {};
            }
        }

        for (const pid in proc) {
            if (proc[pid].isGenesis) {
                proc[pid].children = flatten(proc[pid]);
            }
        }
        for (const pid in proc) {
            const p = proc[pid];
            if (p.isGenesis && p.service && !p.isGUI && !p.isTerminal) {
                if (!(p.service in proc)) {
                    const dummyProc = newProcessLog();
                    dummyProc.cmdline = p.service;
                    dummyProc.isGenesis = true;
                    dummyProc.type = 'service';
                    dummyProc.service = p.service;
                    proc[p.service] = dummyProc;
                }
                proc[p.service].children[pid] = p;
                p.isGenesis = false;
            }
        }
        /*        for (const pid in proc) {
                    const p = proc[pid];
                    if (p.isGenesis && p.type === 'service' && Object.keys(p.children).length === 1) {
                        p.children[Object.keys(p.children)[0]].isGenesis = true;
                        p.children[Object.keys(p.children)[0]].type = 'service';
                        p.isGenesis = false;
                    }
                }*/
        for (const pid in proc) {
            if (proc[pid].isGenesis) {
                cumsum(proc[pid], "cpu_usage");

                cumsum(proc[pid], "mem");
                cumsum(proc[pid], "resident_mem");
                cumsum(proc[pid], "virtual_mem");
                cumsum(proc[pid], "shared_mem");

                cumsum(proc[pid], "net_receive");
                cumsum(proc[pid], "net_send");
                cumsum(proc[pid], "net_total");

                cumsum(proc[pid], "disk_read");
                cumsum(proc[pid], "disk_write");
                cumsum(proc[pid], "disk_total");

                cumsum(proc[pid], "gpu_memory_used");
                cumsum(proc[pid], "nv_dec_usage");
                cumsum(proc[pid], "nv_enc_usage");
                cumsum(proc[pid], "nv_mem_usage");
                cumsum(proc[pid], "nv_sm_usage");
                cumsum(proc[pid], "nv_type");
                cumsum(proc[pid], "gpu_usage_total");
            }
        }
        proc['gui'] = newProcessLog();
        proc['gui'].cmdline = 'Applications';
        proc['gui'].type = 'group';

        proc['service'] = newProcessLog();
        proc['service'].cmdline = 'Services';
        proc['service'].type = 'group';
        for (const pid in proc) {
            const p = proc[pid];
            if (p.isGenesis) {
                if (p.type === 'gui') {
                    p.isGenesis = false;
                    proc['gui'].children[pid] = p;
                } else {
                    p.isGenesis = false;
                    proc['service'].children[pid] = p;
                }
            }
        }
        proc['gui'].isGenesis = true;
        proc['service'].isGenesis = true;

        for (const pid in proc) {
            const p = proc[pid];
            if (!p.isGenesis) {
                delete proc[pid];
            }
        }


        return (
            <React.Fragment>
                <ListHeader layout={layout} config={config} sortClickHandler={this.sortClickHandler.bind(this)}
                            setLayoutHandler={this.setLayoutHandler.bind(this)}/>
                <div>
                    <List depth={0} layout={layout} config={config} items={proc}/>
                </div>
            </React.Fragment>
        );
    }
}
