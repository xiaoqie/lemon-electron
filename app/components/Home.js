// @flow
import React, {Component} from 'react';
import {spawn} from "child_process";
import * as path from 'path';
import List from "./List";
import ListHeader from "./ListHeader";
import {processLog} from "../constants/log-type";
import type {Log} from "../constants/log-type";
import { connect } from 'react-redux';
import styles from './Home.css';
import {theme} from '../node-gtk-theme';
import * as nativeCSS from 'native-css';
const converted = nativeCSS.convert(theme.css);
console.log(theme.css);

type Props = {};

class Home extends Component<Props> {
    props: Props;

    constructor() {
        super();
        this.scrollHandler = this.scrollHandler.bind(this);
    }

    componentDidMount() {
        window.addEventListener('scroll', this.scrollHandler);
    }

    componentWillUnmount(): void {
        window.removeEventListener('scroll', this.scrollHandler);
    }

    setState(state) {
        const scroll = document.documentElement.scrollTop;
        super.setState(state);
        document.documentElement.scrollTop = scroll;
    }

    scrollHandler() {
        // force update no longer works
        this.forceUpdate();
    }

    render() {
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
            <div className={styles.container}>
                <div className={styles.header}>
                    <ListHeader headerInfo={headerInfo}/>
                </div>
                <div className={styles.list}>
                    {/*<div style={converted.close} />*/}
                    <List depth={0} items={processes}/>
                </div>
            </div>
        );
    }
}

export default connect(state => ({
    log: state.log
}), null)(Home);
