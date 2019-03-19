// @flow
import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import {spawn} from "child_process";
import routes from '../constants/routes';
import styles from './Home.css';
import List from "./List";
import ListHeader from "./ListHeader";

type Props = {};

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
                {col: "name", width: 200},
                {col: "cpu", width: 100},
                {col: "mem", width: 100},
                {col: "disk", width: 100},
                {col: "net", width: 100},
                {col: "gpu-usage", width: 100},
                {col: "gpu-mem", width: 100},
            ],
            config: {
                sort: "mem",
                reverseOrder: true
            }
        };
    }

    componentDidMount(): void {
        this.execute('/home/xiaoq/workspace/lemond/cmake-build-debug/lemond', (output) => {
            const scroll = document.documentElement.scrollTop;
            this.setState({log: JSON.parse(output)});
            document.documentElement.scrollTop = scroll;
            // console.log(document.documentElement.scrollTop, scroll);
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

    render() {
        const {log, layout, config} = this.state;
        let {sys, proc} = log;
        if (!proc) {
            return (<div>Empty</div>);
        }
        proc = JSON.parse(JSON.stringify(proc));

        for (const pid in proc) {
            const p = proc[pid];
            p.gpu_usage_total = p.nv_enc_usage + p.nv_mem_usage + p.nv_sm_usage + p.nv_dec_usage;
            p.disk_total = p.disk_read + p.disk_write;
            p.net_total = p.net_send + p.net_receive;
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

        for (const pid in proc) {
            if (["(systemd)", "(gnome-shell)"].includes(proc[pid].comm)) {
                proc[pid].isSpawner = true;
            } else {
                proc[pid].isSpawner = false;
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

        const result = (
            <React.Fragment>
                <ListHeader layout={layout} config={config} sortClickHandler={this.sortClickHandler.bind(this)}/>
                <div>
                    <List depth={0} layout={layout} config={config} items={Object.assign( // filter processes (this simple filter needs soooooo much code in javascript!)
                        ...Object.entries(proc).filter(([k, v]) => v.isGenesis).map(([k, v]) => ({[k]: v}))
                    )}/>
                </div>
            </React.Fragment>
        );
        return result;
    }
}
