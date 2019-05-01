// @flow
import React, {Component} from 'react';
import {remote} from 'electron';
import {connect} from 'react-redux';
import $ from 'jquery';
import List from "./List";
import ListHeader from "./ListHeader";
import styles from './Window.scss';
import {C} from "../utils";
import gtkTheme, {closeListeners} from '../utils/import-gtk-theme'
import ContextMenu from "./ContextMenu";
import GtkWidgetFactory from "./GtkWidgetFactory";
import ScrollbarBase from "./ScrollbarBase";
import * as ListAction from "../actions/list";
import Sunset from "sunset-react";


type Props = {
    log: any,
    list: any,
    listScroll: e => void
};

class Scrollbar extends Component {
    constructor() {
        super();
        this.ref = React.createRef();
    }

    componentDidMount() {
        const target = $(this.props.target.current);
        const scrollbar = $(this.ref.current.scrollbar.current);

        $(target).on("wheel", e => this.ref.current.onWheel(e.originalEvent.deltaY));
        $(target).keydown(e => {
            if (e.which === 38) { // up
                this.ref.current.onWheel(-35);  // probably this is the right value
            } else if (e.which === 40) { // down
                this.ref.current.onWheel(35);
            } else if (e.which === 32) { // space
                this.ref.current.onWheel(200);
            }
        });
        scrollbar.css({"top": target.position().top, "height": `calc(100% - ${target.position().top}px)`});
    }

    componentDidUpdate() {
        const {contentHeight, viewportHeight} = this.props;
        this.ref.current.contentHeight = contentHeight;
        this.ref.current.viewportHeight = viewportHeight;
    }

    ref;

    render() {
        const {onScroll} = this.props;
        return <ScrollbarBase ref={this.ref} onScroll={onScroll}/>
    }
}

class Window extends Component<Props> {
    props: Props;

    constructor() {
        super();
        this.list = React.createRef();
        this.browserWindow = remote.getCurrentWindow();
    }

    componentDidMount() {
        /*        $(window).click(e => {
                    // FIXME: this solution is not good enough
                    $(".popup.window").hide();
                    $(".popover").hide();
                });*/
        const dispatchResizeEvent = () => {
            const {listViewportResize} = this.props;
            listViewportResize($(this.list.current).height());
        };
        this.resizeObserver = new ResizeObserver(dispatchResizeEvent);
        this.resizeObserver.observe(this.list.current);
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
        this.resizeObserver.disconnect();
    }

    resizeObserver;

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
        const {list, listScroll} = this.props;
        return (
            <React.Fragment>
                <ContextMenu/>
                <Sunset.Window remote={remote}>
                    <div className="header-bar headerbar titlebar">
                        <div className="title-center title label">Peak System Monitor</div>
                        <div className="grid box horizontal title-right spacing-6">
                            <div id="window-minimize" className="titlebutton button minimize"
                                 onClick={this.minimizeWindow}>
                                <i className="gtk-icon-theme"/>
                            </div>
                            <div id="window-maximize" className="titlebutton button maximize"
                                 onClick={this.maximizeWindow}>
                                <i className="gtk-icon-theme"/>
                            </div>
                            <div id="window-close" className="titlebutton button close" onClick={this.closeWindow}>
                                <i className="gtk-icon-theme"/>
                            </div>
                        </div>
                    </div>
                    <div style={{display: "grid", gridTemplateRows: "0 minmax(0, 1fr)"}}>
                        <div className={C("searchbar", styles.searchbar)}>
                            <div className="revealer">
                                <div className="box center-item">
                                    <input placeholder="search" className=""/>
                                </div>
                            </div>
                        </div>
                        <div className={C("scrolledwindow", styles.scrolledwindow)}>
                            <div className={C("treeview", "view", styles.treeview)}>
                                <div className={C(styles.header, "header")}>
                                    <ListHeader/>
                                </div>
                                <div ref={this.list} className={C(styles.list, "background")}>
                                    <List height={list.viewportHeight}/>
                                </div>
                            </div>
                            <Scrollbar ref={this.scrollbar}
                                       contentHeight={list.listItems.length * 32} // FIXME: what if not 32?
                                       viewportHeight={list.viewportHeight}
                                       target={this.list}
                                       onScroll={e => listScroll(e)}/>
                        </div>
                    </div>
                </Sunset.Window>
            </React.Fragment>
        );
    }
}

export default connect(state => ({
    log: state.log,
    list: state.list
}), {listScroll: ListAction.listScroll, listViewportResize: ListAction.listViewportResize})(Window);
