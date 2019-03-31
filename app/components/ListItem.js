// @flow
import React, {Component} from 'react';
import deepEqual from 'deep-equal'
import styles from './List.scss';
import List from './List'
import * as gnome from "../utils/gnome";
import * as path from 'path';
import {getDisplayName} from "../utils/name";
import {connect} from "react-redux";
import {listSelect} from "../actions/list";
import {calcIntensity, formatBytes} from "../utils";

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
                             `rgba(${[255, 255 * (1 - intensity), 255 * (1 - intensity), 0.3].join(',')})`
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
        this.collapseHandler = this.collapseHandler.bind(this);
        this.state = {
            collapsed: item.type === 'group' ? false : true
        };
        this.ref = React.createRef();
    }

    shouldComponentUpdate(nextProps, nextState) {
        // FIXME: uncollapse an item doesn't rerender items below
/*        if (!this.renderedLastTime && this.inSight()) {
            return true;
        }
        if (!this.inSight()) {
            this.renderedLastTime = false;
            return false;
        }*/

        const result = (
            deepEqual(this.props.list, nextProps.list) &&
            deepEqual(this.props.item, nextProps.item) &&
            this.state.collapsed === nextState.collapsed
        );
        return !result;
    }

    renderedLastTime = false;

    collapseHandler() {
        const {collapsed} = this.state;
        this.setState({collapsed: !collapsed});
    }

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
        const {parentsChildrenDict} = log;
        if (pid && parentsChildrenDict[item.pid.toString()].parents.includes(pid.toString())) {
            return true;
        }
        return false;
    }

    isParentOf(pid) {
        const {item, log} = this.props;
        const {parentsChildrenDict} = log;
        if (parentsChildrenDict[pid.toString()] && parentsChildrenDict[pid.toString()].parents.includes(item.pid.toString())) {
            return true;
        }
        return false;
    }

    render() {
        const {item, depth} = this.props;
        const {list} = this.props;
        const {layout} = list;
        const {listSelect} = this.props;

        const {collapsed} = this.state;
        const selectable = item.type !== 'group';
        const collapsable = Object.keys(item.children).length !== 0 && item.type !== 'group';
        const noIndent = !selectable;
        const noIcon = noIndent;
        const noInfo = noIndent;
        const isDummy = item.type === 'service';  // dummy processes aren't real processes

        const rowContent = [];
        // const render = this.inSight();
        const render = true;
        if (render) {
            for (const {col, width} of layout) {
                const pad = depth * parseInt(styles.arrowSize);
                switch (col) {
                    case "name":
                        rowContent.push(
                            <ListColumn key={`${item.pid}_${col}`} width={width}>
                                <div style={{display: 'flex', paddingLeft: `${pad}px`}}>
                                    {do {
                                        if (collapsable) {
                                            <i className={styles.dropDownArrow} onClick={this.collapseHandler}>
                                                {collapsed ? 'arrow_right' : 'arrow_drop_down'}
                                            </i>;
                                        } else {
                                            <div style={{display: 'inline-block', paddingLeft: styles.arrowSize}}/>;
                                        }
                                    }}
                                    {!noIcon && <img src={gnome.getIconURL(item)} alt="" className={styles.icon}/>}
                                    <span className={styles.inlineLeft} title={item.cmdline}>
                                        {getDisplayName(item)}
                                        {item.type === 'terminal' && ` [@.../${path.basename(item.cwd)}]`}
                                    </span>
                                </div>
                            </ListColumn>
                        );
                        break;
                    case "pid":
                        rowContent.push(
                            <ListColumn key={`${item.pid}_${col}`} right width={width}>
                                {do {
                                    if (noInfo) {
                                        '';
                                    } else if (!isDummy) {
                                        item.pid;
                                    } else {
                                        '';
                                    }
                                }}
                            </ListColumn>);
                        break;
                    case "cpu":
                        rowContent.push(
                            <ListColumn key={`${item.pid}_${col}`} right width={width}
                                        intensity={calcIntensity(item.cpu_usage / 4, 0.8)}>
                                {do {
                                    if (noInfo) {
                                        '';
                                    } else {
                                        `${(item.cpu_usage / 4 * 100.0).toFixed(0)}%`;
                                    }
                                }}
                            </ListColumn>);
                        break;
                    case "mem":
                        rowContent.push(
                            <ListColumn key={`${item.pid}_${col}`} right width={width}
                                        intensity={calcIntensity(item.mem, 4 * 1024 * 1024 * 1024)}>
                                {do {
                                    if (noInfo) {
                                        '';
                                    } else {
                                        formatBytes(item.mem, 1)
                                    }
                                }}
                            </ListColumn>);
                        break;
                    case "disk":
                        rowContent.push(
                            <ListColumn key={`${item.pid}_${col}`} right width={width}
                                        intensity={calcIntensity(item.disk_total, 10 * 1024)}>
                                {do {
                                    if (noInfo) {
                                        '';
                                    } else {
                                        `${formatBytes(item.disk_total * 1024, 1)}/s`
                                    }
                                }}
                            </ListColumn>);
                        break;
                    case "net":
                        rowContent.push(
                            <ListColumn key={`${item.pid}_${col}`} right width={width}
                                        intensity={calcIntensity(item.net_total, 2 * 1024)}>
                                {do {
                                    if (noInfo) {
                                        '';
                                    } else {
                                        `${formatBytes(item.net_total * 1024, 1)}/s`
                                    }
                                }}
                            </ListColumn>);
                        break;
                    case "gpu-usage":
                        rowContent.push(
                            <ListColumn key={`${item.pid}_${col}`} right width={width}
                                        intensity={calcIntensity(item.gpu_usage_total, 80)}>
                                {do {
                                    if (noInfo) {
                                        '';
                                    } else {
                                        `${(item.gpu_usage_total).toFixed(0)}%`
                                        /* item.nv_type */
                                    }
                                }}
                            </ListColumn>);
                        break;
                    case "gpu-mem":
                        rowContent.push(
                            <ListColumn key={`${item.pid}_${col}`} right width={width}
                                        intensity={calcIntensity(item.gpu_memory_used, 2 * 1024)}>
                                {do {
                                    if (noInfo) {
                                        '';
                                    } else {
                                        formatBytes(item.gpu_memory_used * 1024 * 1024, 1)
                                    }
                                }}
                            </ListColumn>);
                        break;
                    default:

                }
            }
        }
        return (
            <React.Fragment>
                <div ref={this.ref} key={item.pid} className={styles.bigRow}
                     onClick={() => selectable && listSelect(item.pid)}
                     active={do {
                         if (item.pid === list.currentSelection && selectable) {
                             "active"
                         } else if (this.isChildOf(list.currentSelection)) {
                             "semi"
                         // } else if (this.isParentOf(list.currentSelection) && selectable) {
                         //     "semi"
                         } else {
                             "inactive"
                         }
                     }}>
                    <div className={styles.row}>
                        {render && rowContent}
                    </div>
                </div>
                {Object.keys(item.children).length !== 0 && !collapsed &&
                <List key={`${item.pid}_children`}
                      depth={noIndent ? depth : depth + 1}
                      items={item.children}/>}
            </React.Fragment>
        );
    }
}

export default connect(state => ({
    list: state.list,
    log: state.log
}), {listSelect})(ListItem);
