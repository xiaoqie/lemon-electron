// @flow
import React, {Component} from 'react';
import {spawn} from "child_process";
import * as path from 'path';
import List from "./List";
import ListHeader from "./ListHeader";
import {processLog} from "../constants/log-type";
import type {Log} from "../constants/log-type";
import { connect } from 'react-redux';

type Props = {};

class Home extends Component<Props> {
    props: Props;

    ws: WebSocket;

    constructor() {
        super();
        this.state = {
            log: {},
            config: {
                layout: [
                    {col: "name", width: 300},
                    {col: "pid", width: 80},
                    {col: "cpu", width: 80},
                    {col: "mem", width: 100},
                    {col: "disk", width: 100},
                    {col: "net", width: 100},
                    {col: "gpu-usage", width: 80},
                    {col: "gpu-mem", width: 100},
                ],
                sort: "mem",
                reverseOrder: true
            }
        };
        this.sortClickHandler = this.sortClickHandler.bind(this);
        this.setLayoutHandler = this.setLayoutHandler.bind(this);
        this.handleScroll = this.handleScroll.bind(this);
    }

    async componentDidMount() {
        window.addEventListener('scroll', this.handleScroll);
    }

    componentWillUnmount(): void {
        window.removeEventListener('scroll', this.handleScroll);
    }

    setState(state) {
        console.log("setState")
        const scroll = document.documentElement.scrollTop;
        super.setState(state);
        document.documentElement.scrollTop = scroll;
    }

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

    handleScroll() {
        this.setState(this.state);
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
        const {config} = this.state;
        this.setState({config: {...config, layout: l}});
    }

    render() {
        const {layout, config} = this.state;
        const {log} = this.props;
        const {sys, processes} = log;
        // console.log(sys);
        // console.log(proc);
        if (!processes) {
            return (<div>Loading...</div>);
        }
        const headerInfo = {
            "cpu": sys.cpus.cpu / 4,
            "mem": 1 - sys.MemAvailable/sys.MemTotal
        };

        return (
            <React.Fragment>
                <ListHeader config={config}
                            headerInfo={headerInfo}
                            sortClickHandler={this.sortClickHandler}
                            setLayoutHandler={this.setLayoutHandler}/>
                <List depth={0} config={config} items={processes}/>
            </React.Fragment>
        );
    }
}

export default connect(state => ({
    log: state.log
}), null)(Home);
