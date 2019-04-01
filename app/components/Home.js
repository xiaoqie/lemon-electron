// @flow
import React, {Component} from 'react';
import {remote} from 'electron';
import List from "./List";
import ListHeader from "./ListHeader";
import {connect} from 'react-redux';
import styles from './Home.scss';
import {C} from "../utils";


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
            return (<div>Connecting...</div>);
        }
        const headerInfo = {
            "cpu": sys.cpus.cpu / 4,
            "mem": 1 - sys.MemAvailable / sys.MemTotal
        };

        return (
            <div className={C(styles.container, "treeview", "view", "window", "decoration")}>
                <div className="header-bar headerbar titlebar">
                    {/*<div className="titlebar">*/}
                        <div className="title">Lemonitor</div>
                        <div className="titlebutton-wrapper">
                            <span className="titlebutton button" onClick={() => remote.getCurrentWindow().minimize()}>
                                <i className="material-icons">minimize</i>
                            </span>
                            <span className="titlebutton button" onClick={() => {
                                const window = remote.getCurrentWindow();
                                if (!window.isMaximized()) {
                                    window.maximize();
                                } else {
                                    window.unmaximize();
                                }
                            }}>
                                <i className="material-icons">fullscreen</i>
                            </span>
                            <span className="titlebutton button" onClick={() => remote.getCurrentWindow().close()}>
                                <i className="material-icons">close</i>
                            </span>
                        </div>
                    {/*</div>*/}
                </div>
                {/*<div className="treeview view">*/}
                <div className={C(styles.header, "header", "background")}>
                    <ListHeader headerInfo={headerInfo}/>
                </div>
                <div className={C(styles.list, "treeview", "background")}>
                    <List depth={0} items={processes}/>
                </div>
                {/*</div>*/}
            </div>
        );
    }
}

export default connect(state => ({
    log: state.log
}), null)(Home);
