// @flow
import React, {Component} from 'react';
import {remote} from 'electron';
import List from "./List";
import ListHeader from "./ListHeader";
import {connect} from 'react-redux';
import $ from 'jquery';
import styles from './Home.scss';
import {C} from "../utils";
import gtkTheme, {closeListeners} from '../utils/import-gtk-theme'
import ContextMenu from "./ContextMenu";
import GtkWidgetFactory from "./GtkWidgetFactory";


type Props = {};

class Home extends Component<Props> {
    props: Props;

    constructor() {
        super();
        this.list = React.createRef();
        this.listLastScrollTop = 0;
    }

    componentDidMount() {
        $(window).click(e => {
            // FIXME: this solution is not good enough
            $(".popup.window").hide();
            $(".popover").hide();
        });
        window.onbeforeunload = (e) => {
            closeListeners();
        }
    }

    componentWillUpdate() {
        // if (this.list.current)
        //     this.listLastScrollTop = this.list.current.scrollTop;
    }

    componentDidUpdate() {
        // if (this.list.current)
        //     this.list.current.scrollTop = this.listLastScrollTop;
    }

    componentWillUnmount(): void {
    }

    minimizeWindow() {
        remote.getCurrentWindow().minimize();
    }

    maximizeWindow() {
        const window = remote.getCurrentWindow();
        if (!window.isMaximized()) {
            window.maximize();
        } else {
            window.unmaximize();
        }
    }

    closeWindow() {
        remote.getCurrentWindow().close();
    }

    render() {
        // return <GtkWidgetFactory/>;
        const {log} = this.props;
        let {processes} = log;
        // console.log(sys);
        // console.log(proc);
        if (!processes || !gtkTheme()) {
            return (<div className="loading">Connecting...</div>);
        }

        processes = {...processes};
        // filter out non-genesis processes to pass to <List>
        for (const pid in processes) {
            const p = processes[pid];
            if (!p.isGenesis) {
                delete processes[pid];
            }
        }

        return (
            <div className={C(styles.container, "window", "decoration", "csd")}>
                <ContextMenu/>
                <div className="header-bar headerbar titlebar">
                    <div className="title-center title">Lemonitor</div>
                    <div className="box horizontal title-right spacing-6">
                        <div id="window-minimize" className="titlebutton button minimize" onClick={this.minimizeWindow}>
                            <img src={gtkTheme()?.iconMap["window-minimize-symbolic"]}/>
                        </div>
                        <div id="window-maximize" className="titlebutton button maximize" onClick={this.maximizeWindow}>
                            <img src={gtkTheme()?.iconMap["window-maximize-symbolic"]}/>
                        </div>
                        <div id="window-close" className="titlebutton button close" onClick={this.closeWindow}>
                            <img src={gtkTheme()?.iconMap["window-close-symbolic"]}/>
                        </div>
                    </div>
                </div>
                <div className={C("searchbar", styles.searchbar)}>
                    <div className="revealer">
                        <div className="box center">
                            <input placeholder="search" className={"view"}/>
                        </div>
                    </div>
                </div>
                <div className={C("treeview", "view", styles.treeview)}>
                    <div className={C(styles.header, "header")}>
                        <ListHeader/>
                    </div>
                    <div ref={this.list} className={C(styles.list, "background")}>
                        <List depth={0} items={processes}/>
                    </div>
                </div>
            </div>
        );
    }
}

export default connect(state => ({
    log: state.log
}), null)(Home);
