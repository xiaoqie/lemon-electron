// @flow
import React, {Component} from 'react';
import {remote} from 'electron';
import $ from 'jquery';
import gtkTheme from '../utils/import-gtk-theme'
import ContextMenu from "./ContextMenu";
import '../gtk.global.scss'
import {moveMenuWindowTo} from "../utils";
import Sunset from "sunset-react";

type Props = {};

export default class GtkWidgetFactory extends Component<Props> {
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
        $("#window-minimize").click(() => remote.getCurrentWindow().minimize());
        $("#window-maximize").click(() => {
            const window = remote.getCurrentWindow();
            if (!window.isMaximized()) {
                window.maximize();
            } else {
                window.unmaximize();
            }
        });
        $("#window-close").click(() => remote.getCurrentWindow().close());
        $(".combobox").click(e => {
            const self = $(e.currentTarget);
            const target = $(`#${self.attr("target")}`);
            if (target) {
                setImmediate(() => target.show());
                const menuitem = target.find(".menuitem");
                moveMenuWindowTo(target, {
                    x: self.position().left,
                    y: self.position().top + self.height() + (self.outerHeight(true) - self.height()) / 2 - (target.outerHeight(true) - target.height()) / 2
                });
                menuitem.css({"width": self.width() - (menuitem.outerWidth(true) - menuitem.width())});
            }
        });
        $(".popup.toggle.button").click(e => {
            const self = $(e.currentTarget);
            const target = $(`#${self.attr("target")}`);
            if (target) {
                setImmediate(() => target.show());
                moveMenuWindowTo(target, {
                    x: self.position().left - target.width() / 2,
                    y: self.position().top + self.outerHeight(true)
                });
            }
        });
        $(".toggle.button").click(e => {
            const self = $(e.currentTarget);
            if (self.hasClass("checked")) {
                self.removeClass("checked");
            } else {
                self.addClass("checked");
            }
        });
        $(".check, .radio").click(e => {
            const self = $(e.currentTarget);
            if (self.hasClass("checked")) {
                self.removeClass("checked");
            } else {
                self.addClass("checked");
            }
        });
    }

    componentWillUpdate() {
        if (this.list.current)
            this.listLastScrollTop = this.list.current.scrollTop;
    }

    componentDidUpdate() {
        if (this.list.current)
            this.list.current.scrollTop = this.listLastScrollTop;
    }

    componentWillUnmount(): void {
    }

    render() {
        return (
            <React.Fragment>
                <ContextMenu/>
                <Sunset.Window browserWindow={remote.getCurrentWindow()}>
                    <div id="combobox-menu-1" className="window background csd popup">
                        <div className="menu decoration">
                            <div className="menuitem vertical-center">
                                <div className="label">
                                    Left
                                </div>
                            </div>
                            <div className="menuitem vertical-center">
                                <div className="label">
                                    Middle
                                </div>
                            </div>
                            <div className="menuitem vertical-center">
                                <div className="label">
                                    Right
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="popover-menu-1" className="popover">
                        <div className="stack contents background menu">
                            <div className="box vertical">
                                <div className="modelbutton flat vertical-center">
                                    <div className="label">
                                        Get Busy
                                    </div>
                                </div>
                                <div className="modelbutton flat vertical-center">
                                    <div className="label">
                                        Dark Theme
                                    </div>
                                </div>
                                <div className="modelbutton flat vertical-center">
                                    <div className="label">
                                        Slide Pages
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="header-bar headerbar titlebar">
                        {/*<div className="title">Lemonitor</div>*/}
                        <div className="stack-switcher stackswitcher horizontal linked title-center">
                            <div className="button text-button center-item">
                                <div className="label">
                                    Page1
                                </div>
                            </div>
                            <div className="button text-button center-item checked">
                                <div className="label">
                                    Page2
                                </div>
                            </div>
                            <div className="button text-button center-item">
                                <div className="label">
                                    Page3
                                </div>
                            </div>
                        </div>
                        <div className="grid box horizontal title-right spacing-6">
                            <div className="button image-button toggle popup center-item" target="popover-menu-1">
                                <i className="gtk-icon-theme">open_menu_symbolic</i>
                            </div>
                            <div className="separator vertical"/>
                            <div id="window-minimize" className="titlebutton button minimize">
                                <i className="gtk-icon-theme"/>
                            </div>
                            <div id="window-maximize" className="titlebutton button maximize">
                                <i className="gtk-icon-theme"/>
                            </div>
                            <div id="window-close" className="titlebutton button close">
                                <i className="gtk-icon-theme"/>
                            </div>
                        </div>
                    </div>
                    <div className="background">
                        <div className="stack">
                            <div className="searchbar toolbar">
                                <div className="revealer">
                                    <div className="box center-item">
                                        <input placeholder="search" className="view"/>
                                    </div>
                                </div>
                            </div>
                            <div className="box vertical spacing-10 container-border-10">
                                <div className="box horizontal spacing-6">
                                    <div className="box vertical spacing-10">
                                        <div className="combobox horizontal linked" target="combobox-menu-1">
                                            <input className="flex-grow" value="comboboxentry"/>
                                            <div className="button combo toggle center-item horizontal">
                                                <div className="arrow icon right">
                                                    <i className="gtk-icon-theme">pan_down_symbolic</i>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="combobox horizontal linked">
                                            <input className="flex-grow disabled" value="comboboxentry" disabled/>
                                            <div className="button combo toggle center-item horizontal disabled"
                                                 disabled>
                                                <div className="arrow icon right">
                                                    <i className="gtk-icon-theme">pan_down_symbolic</i>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="combobox" target="combobox-menu-1">
                                            <div className="button combo toggle center-item horizontal">
                                                <div className="label">
                                                    Left
                                                </div>
                                                <div className="arrow icon right">
                                                    <i className="gtk-icon-theme">pan_down_symbolic</i>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="linked horizontal">
                                            <div className="combobox flex-grow" target="combobox-menu-1">
                                                <div className="box">
                                                    <div className="button combo toggle center-item horizontal">
                                                        <div className="label">
                                                            Left
                                                        </div>
                                                        <div className="arrow icon right">
                                                            <i className="gtk-icon-theme">pan_down_symbolic</i>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="combobox flex-grow" target="combobox-menu-1">
                                                <div className="box">
                                                    <div className="button combo toggle center-item horizontal">
                                                        <div className="label">
                                                            Left
                                                        </div>
                                                        <div className="arrow icon right">
                                                            <i className="gtk-icon-theme">pan_down_symbolic</i>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="combobox flex-grow" target="combobox-menu-1">
                                                <div className="box">
                                                    <div className="button combo toggle center-item horizontal">
                                                        <div className="label">
                                                            Left
                                                        </div>
                                                        <div className="arrow icon right">
                                                            <i className="gtk-icon-theme">pan_down_symbolic</i>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <input value="entry"/>
                                        <input value="entry" className="disabled" disabled/>
                                        <div className="horizontal box spacing-6">
                                            <div className="label vertical-center">label</div>
                                            <div className="label vertical-center disabled" disabled>label</div>
                                            <div className="horizontal spinbutton">
                                                <input className="text"/>
                                                <div className="button center-item down">
                                                    <div className="arrow icon right">
                                                        <i className="gtk-icon-theme">list_remove_symbolic</i>
                                                    </div>
                                                </div>
                                                <div className="button center-item up">
                                                    <div className="arrow icon right">
                                                        <i className="gtk-icon-theme">list_add_symbolic</i>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="horizontal box spacing-10">
                                            <div className="vertical box spacing-10">
                                                <div className="horizontal box">
                                                    <div className="check checked vertical-center"/>
                                                    <div className="label vertical-center">checkbutton</div>
                                                </div>
                                                <div className="horizontal box">
                                                    <div className="check vertical-center"/>
                                                    <div className="label vertical-center">checkbutton</div>
                                                </div>
                                                <div className="horizontal box">
                                                    <div className="check vertical-center indeterminate"/>
                                                    <div className="label vertical-center">checkbutton</div>
                                                </div>
                                                <div className="horizontal box">
                                                    {/* disabled suffers from the bug that background-image is used instead of -gtk-icon-source */}
                                                    <div className="check checked vertical-center disabled"/>
                                                    <div className="label vertical-center">checkbutton</div>
                                                </div>
                                                <div className="horizontal box">
                                                    <div className="check vertical-center disabled"/>
                                                    <div className="label vertical-center">checkbutton</div>
                                                </div>
                                                <div className="horizontal box">
                                                    <div className="check vertical-center indeterminate disabled"/>
                                                    <div className="label vertical-center">checkbutton</div>
                                                </div>
                                            </div>
                                            <div className="vertical box spacing-10">
                                                <div className="horizontal box">
                                                    <div className="radio checked vertical-center"/>
                                                    <div className="label vertical-center">radiobutton</div>
                                                </div>
                                                <div className="horizontal box">
                                                    <div className="radio vertical-center"/>
                                                    <div className="label vertical-center">radiobutton</div>
                                                </div>
                                                <div className="horizontal box">
                                                    <div className="radio vertical-center indeterminate"/>
                                                    <div className="label vertical-center">radiobutton</div>
                                                </div>
                                                <div className="horizontal box">
                                                    {/* disabled suffers from the bug that background-image is used instead of -gtk-icon-source */}
                                                    <div className="radio checked vertical-center disabled"/>
                                                    <div className="label vertical-center">radiobutton</div>
                                                </div>
                                                <div className="horizontal box">
                                                    <div className="radio vertical-center disabled"/>
                                                    <div className="label vertical-center">radiobutton</div>
                                                </div>
                                                <div className="horizontal box">
                                                    <div className="radio vertical-center indeterminate disabled"/>
                                                    <div className="label vertical-center">radiobutton</div>
                                                </div>
                                            </div>
                                            <div className="vertical box spacing-10">
                                                <div className="spinner"/>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="separator vertical"/>
                                    <div className="box vertical spacing-10">
                                        <div className="button text-button toggle center-item checked">
                                            <div className="label">
                                                togglebutton
                                            </div>
                                        </div>
                                        <div className="button text-button toggle center-item disabled" disabled>
                                            <div className="label">
                                                togglebutton
                                            </div>
                                        </div>
                                        <div className="button text-button toggle center-item">
                                            <div className="label">
                                                togglebutton
                                            </div>
                                        </div>
                                        <div className="switch checked">
                                            <div className="slider"></div>
                                        </div>
                                    </div>
                                    <div className="separator vertical"/>
                                    <div className="box vertical spacing-10" style={{width: "150px"}}>
                                        <div className="progressbar horizontal">
                                            <div className="trough full-width">
                                                <div className="progress"/>
                                            </div>
                                        </div>
                                        <div className="levelbar continuous horizontal">
                                            <div className="trough full-width">
                                                <div className="block high"/>
                                            </div>
                                        </div>
                                        <div className="scale horizontal">
                                            <div className="contents">
                                                <div className="trough full-width">
                                                    <div className="slider"/>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="scale horizontal marks-after">
                                            <div className="contents">
                                                <div className="trough full-width">
                                                    <div className="slider"/>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="box horizontal spacing-10" style={{height: "100px"}}>
                                            <div className="progressbar vertical">
                                                <div className="trough full-height">
                                                    <div className="progress full-height"/>
                                                </div>
                                            </div>
                                            <div className="scale vertical">
                                                <div className="contents full-height">
                                                    <div className="trough full-height">
                                                        <div className="slider"/>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="separator horizontal"/>
                                <div className="box"></div>
                            </div>
                        </div>
                    </div>
                </Sunset.Window>
            </React.Fragment>
        );
    }
}
