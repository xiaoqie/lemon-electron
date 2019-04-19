// @flow
import React, {Component} from 'react';
import deepEqual from 'deep-equal'
import styles from './List.scss';
import List from './List'
import * as gnome from "../utils/gnome";
import * as path from 'path';
import {getDisplayName} from "../utils/name";
import {connect} from "react-redux";
import {listSelect, listUncollapse} from "../actions/list";
import {calcIntensity, formatBytes} from "../utils";
import {C} from "../utils";

class ListColumn extends Component<Props> {
    props: Props;

    shouldComponentUpdate(nextProps): boolean {
        const {children, width} = this.props;
        let result;
        if (children instanceof Array) {
            result = deepEqual(children, nextProps.children);
        } else {
            result = false;
        }
        return !result || width !== nextProps.width;
    }

    render() {
        const {width, children, right} = this.props;
        const {intensity} = this.props;
        return (
            <div className={styles.column}
                 style={{
                     width: `${width}px`,
                     textAlign: right ? 'right' : 'left',
                     backgroundColor: do {
                         if (intensity) {
                             // `rgba(${[255, 255 * (1 - intensity), 255 * (1 - intensity), 0.3].join(',')})`
                             `rgba(${[255, 0, 0, intensity / 3].join(',')})`
                         } else {
                             'rgba(255, 255, 255, 0)'
                         }
                     }
                 }}
            >
                <div className={styles.content}>
                    {children}
                </div>
                <div className={styles.separator}/>
            </div>
        );
    }
}

class ListItem extends Component<Props> {
    props: Props;

    constructor(props) {
        super(props);
        const {item} = props;
        this.ref = React.createRef();
    }

    shouldComponentUpdate(nextProps, nextState) {
        // FIXME: uncollapse an item doesn't rerender items below
        /*                if (!this.renderedLastTime && this.inSight()) {
                            return true;
                        }
                        if (!this.inSight()) {
                            this.renderedLastTime = false;
                            return false;
                        }*/

        const result = (
            deepEqual(this.props.item, nextProps.item) &&
            deepEqual(this.props.layout, nextProps.layout) &&
            deepEqual(this.props.currentSelection, nextProps.currentSelection)
        );
        return !result;
    }

    renderedLastTime = false;

    inSight() {
        let render = true;
        if (this.ref.current) {
            const scroll = document.documentElement.scrollTop;
            const windowHeight = window.innerHeight;
            const offset = this.ref.current.offsetTop;
            const height = this.ref.current.offsetHeight;
            if (offset + height < scroll || offset > scroll + windowHeight) {
                render = false;
            }
        }
        return render;
    }

    isChildOf(pid) {
        const {item, log} = this.props;
        const {parentsChildrenDict} = this.props;
        if (pid && parentsChildrenDict[item.pid.toString()].parents.includes(pid.toString())) {
            return true;
        }
        return false;
    }

    isParentOf(pid) {
        const {item, log} = this.props;
        const {parentsChildrenDict} = this.props;
        if (parentsChildrenDict[pid.toString()] && parentsChildrenDict[pid.toString()].parents.includes(item.pid.toString())) {
            return true;
        }
        return false;
    }

    render() {
        const {item, layout, listSelect, listUncollapse, currentSelection} = this.props;
        const rowContent = [];
        for (const {col, width} of layout) {
            switch (col) {
                case "name": {
                    const pad = item.depth * parseInt(styles.arrowSize, 10);
                    rowContent.push(
                        <ListColumn key={`${item.pid}_${col}`} width={width}>
                            <div style={{display: 'flex', paddingLeft: `${pad}px`}}>
                                {do {
                                    if (item.collapsable) {
                                        <i className={styles.dropDownArrow}
                                           onClick={() => listUncollapse(item.pid)}>
                                            {!item.expanded ? 'arrow_right' : 'arrow_drop_down'}
                                        </i>;
                                    } else {
                                        <div style={{display: 'inline-block', paddingLeft: styles.arrowSize}}/>;
                                    }
                                }}
                                {item.icon !== 'none' && <img src={item.icon} alt="" className={styles.icon}/>}
                                <span className={styles.inlineLeft} title={item.cmdline}>
                                    {item.username && `[${item.username}] `}
                                    {item.description ?? item.name}
                                    {/*{item.type === 'terminal' && ` [@.../${path.basename(item.cwd)}]`}*/}
                                </span>
                            </div>
                        </ListColumn>
                    );
                    break;
                }
                case "pid":
                    rowContent.push(
                        <ListColumn key={`${item.pid}_${col}`} right width={width}>
                            {item.displayPid}
                        </ListColumn>);
                    break;
                case "cpu":
                    rowContent.push(
                        <ListColumn key={`${item.pid}_${col}`} right width={width}
                                    intensity={calcIntensity(item.cpu_usage / 4, 0.8)}>
                            {item.cpu}
                        </ListColumn>);
                    break;
                case "mem":
                    rowContent.push(
                        <ListColumn key={`${item.pid}_${col}`} right width={width}
                                    intensity={calcIntensity(item.mem, 4 * 1024 * 1024 * 1024)}>
                            {item.mem}
                        </ListColumn>);
                    break;
                case "disk":
                    rowContent.push(
                        <ListColumn key={`${item.pid}_${col}`} right width={width}
                                    intensity={calcIntensity(item.disk_total, 10 * 1024)}>
                            {item.disk}
                        </ListColumn>);
                    break;
                case "net":
                    rowContent.push(
                        <ListColumn key={`${item.pid}_${col}`} right width={width}
                                    intensity={calcIntensity(item.net_total, 2 * 1024)}>
                            {item.net}
                        </ListColumn>);
                    break;
                case "gpu-usage":
                    rowContent.push(
                        <ListColumn key={`${item.pid}_${col}`} right width={width}
                                    intensity={calcIntensity(item.gpu_usage_total, 80)}>
                            {item.gpu}
                        </ListColumn>);
                    break;
                case "gpu-mem":
                    rowContent.push(
                        <ListColumn key={`${item.pid}_${col}`} right width={width}
                                    intensity={calcIntensity(item.gpu_memory_used, 2 * 1024)}>
                            {item.vram}
                        </ListColumn>);
                    break;
                default:

            }
        }
        let isSelected = false;
        if (item.pid === currentSelection && item.selectable || this.isChildOf(currentSelection)) {
            isSelected = true;
        }
        return (
            <div ref={this.ref} key={item.pid}
                 onMouseDown={() => item.selectable && listSelect(item.pid)}
                 id={`row_${item.pid}`}
                 className={C(styles.row,
                     isSelected ? "selected" : "",
                     "view")}
                 tabIndex={item.selectable ? -1 : "disabled"}>
                {rowContent}
            </div>
        );
    }
}

export default connect(state => ({
    currentSelection: state.list.currentSelection,
    layout: state.list.layout,
    parentsChildrenDict: state.log.parentsChildrenDict
}), {listSelect, listUncollapse})(ListItem);
