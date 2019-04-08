// @flow
import React, {Component} from 'react';
import {remote} from 'electron';
import $ from 'jquery';
import gtkTheme from '../utils/import-gtk-theme'
import ContextMenu from "./ContextMenu";
import '../gtk.global.scss'
import {moveMenuWindowTo} from "../utils";

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
            <div className="window decoration csd">
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
                <ContextMenu/>
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
                    <div className="box horizontal title-right spacing-6">
                        <div className="button image-button toggle popup center-item" target="popover-menu-1">
                            <img src={gtkTheme()?.iconMap["open-menu-symbolic"]}/>
                        </div>
                        <div className="separator"/>
                        <div id="window-minimize" className="titlebutton button minimize">
                            {/*style={{backgroundImage: `url(${gtkTheme()?.iconMap["window-minimize-symbolic"]})`}}*/}
                            <img src={gtkTheme()?.iconMap["window-minimize-symbolic"]}/>
                        </div>
                        <div id="window-maximize" className="titlebutton button maximize">
                            {/*// style={{backgroundImage: `url(${gtkTheme()?.iconMap["window-maximize-symbolic"]})`}}*/}
                            <img src={gtkTheme()?.iconMap["window-maximize-symbolic"]}/>
                        </div>
                        <div id="window-close" className="titlebutton button close">
                            {/*// style={{backgroundImage: `url(${gtkTheme()?.iconMap["window-close-symbolic"]})`}}*/}
                            <img src={gtkTheme()?.iconMap["window-close-symbolic"]}/>
                        </div>
                    </div>
                </div>
                <div className="stack background">
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
                                <div className="combobox" target="combobox-menu-1">
                                    <div className="button combo toggle center-item horizontal">
                                        <div className="label">
                                            Left
                                        </div>
                                        <div className="arrow icon right"
                                             style={{backgroundImage: `url(${gtkTheme()?.iconMap["pan-down-symbolic"]})`}}>
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
                                                <div className="arrow icon right"
                                                     style={{backgroundImage: `url(${gtkTheme()?.iconMap["pan-down-symbolic"]})`}}>
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
                                                <div className="arrow icon right"
                                                     style={{backgroundImage: `url(${gtkTheme()?.iconMap["pan-down-symbolic"]})`}}>
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
                                                <div className="arrow icon right"
                                                     style={{backgroundImage: `url(${gtkTheme()?.iconMap["pan-down-symbolic"]})`}}>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <input/>
                                <input className="disabled" disabled/>
                                <div className="combobox horizontal linked" target="combobox-menu-1">
                                    <input className="flex-grow"/>
                                    <div className="button combo toggle center-item horizontal">
                                        <div className="arrow icon right"
                                             style={{backgroundImage: `url(${gtkTheme()?.iconMap["pan-down-symbolic"]})`}}>
                                        </div>
                                    </div>
                                </div>
                                <div className="combobox horizontal linked">
                                    <input className="flex-grow disabled" disabled/>
                                    <div className="button combo toggle center-item horizontal disabled" disabled>
                                        <div className="arrow icon right"
                                             style={{backgroundImage: `url(${gtkTheme()?.iconMap["pan-down-symbolic"]})`}}>
                                        </div>
                                    </div>
                                </div>
                                <div className="horizontal box spacing-6">
                                    <div className="label vertical-center">label</div>
                                    <div className="label vertical-center disabled" disabled>label</div>
                                    <div className="horizontal spinbutton">
                                        <input className="text"/>
                                        <div className="button center-item down">
                                            <div className="arrow icon right"
                                                 style={{backgroundImage: `url(${gtkTheme()?.iconMap["list-remove-symbolic"]})`}}>
                                            </div>
                                        </div>
                                        <div className="button center-item up">
                                            <div className="arrow icon right"
                                                 style={{backgroundImage: `url(${gtkTheme()?.iconMap["list-add-symbolic"]})`}}>
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
                                </div>
                            </div>
                            <div className="separator"/>
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
                            </div>
                            <div className="separator"/>
                        </div>
                        <div className="separator"/>
                        <div className="box"></div>
                    </div>
                </div>
            </div>
        );
    }
}
