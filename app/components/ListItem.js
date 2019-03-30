// @flow
import React, {Component} from 'react';
import deepEqual from 'deep-equal'
import styles from './List.scss';
import List from './List'
import * as gnome from "../utils/gnome";
import * as path from 'path';
import {getDisplayName} from "../utils/name";

function formatBytes(bytes, digits) {
    // if (bytes < 1024) return bytes + " Bytes";
    if (bytes < 1048576) return (bytes / 1024).toFixed(digits) + " KiB";
    if (bytes < 1073741824) return (bytes / 1048576).toFixed(digits) + " MiB";
    return (bytes / 1073741824).toFixed(digits) + " GiB";
}

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
        let {intensity} = this.props;
        return (
            <div className={styles.column}
                 style={{
                     width: `${width}px`,
                     textAlign: right ? 'right' : 'left',
                     backgroundColor: do {
                         if (intensity) {
                             `rgba(${[255, 255 * (1-intensity), 255 * (1-intensity), 0.3].join(',')})`
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

export default class ListItem extends Component<Props> {
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
        if (!this.renderedLastTime && this.inSight()) {
            return true;
        }
        if (!this.inSight()) {
            this.renderedLastTime = false;
            return false;
        }

        const {item, layout, config} = this.props;
        const {collapsed} = this.state;
        const result = deepEqual(item, nextProps.item) && deepEqual(layout, nextProps.layout) && deepEqual(config, nextProps.config) && collapsed === nextState.collapsed;
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

    render() {
        const {pid, item, depth, config} = this.props;
        const {layout} = config;
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
                const emptyColumn = <ListColumn key={`${pid}_${col}`} right width={width}/>;
                switch (col) {
                    case "name":
                        rowContent.push(
                            <ListColumn key={`${pid}_${col}`} width={width}>
                                <div style={{
                                    display: 'flex',
                                    paddingLeft: `${pad}px`,
                                }}>
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
                        if (noInfo) rowContent.push(emptyColumn);
                        else rowContent.push(
                            <ListColumn key={`${pid}_${col}`} right width={width}>
                                {do {
                                    if (!isDummy) {
                                        pid;
                                    } else {
                                        '-';
                                    }
                                }}
                            </ListColumn>);
                        break;
                    case "cpu":
                        if (noInfo) rowContent.push(emptyColumn);
                        else rowContent.push(
                            <ListColumn key={`${pid}_${col}`} right width={width} intensity={Math.tanh(item.cpu_usage / 4 * 2)}>
                                {(item.cpu_usage / 4 * 100.0).toFixed(0)}%
                            </ListColumn>);
                        break;
                    case "mem":
                        if (noInfo) rowContent.push(emptyColumn);
                        else rowContent.push(
                            <ListColumn key={`${pid}_${col}`} right width={width} intensity={Math.tanh(item.mem / 1024 / 1024 / 1024 * 2)}>
                                {formatBytes(item.mem, 1)}
                            </ListColumn>);
                        break;
                    case "disk":
                        if (noInfo) rowContent.push(emptyColumn);
                        else rowContent.push(
                            <ListColumn key={`${pid}_${col}`} right width={width} intensity={Math.tanh(item.disk_total / 1024 / 10)}>
                                {formatBytes(item.disk_total * 1024, 1)}/s
                            </ListColumn>);
                        break;
                    case "net":
                        if (noInfo) rowContent.push(emptyColumn);
                        else rowContent.push(
                            <ListColumn key={`${pid}_${col}`} right width={width} intensity={Math.tanh(item.net_total / 1024)}>
                                {formatBytes(item.net_total * 1024, 1)}/s
                            </ListColumn>);
                        break;
                    case "gpu-usage":
                        if (noInfo) rowContent.push(emptyColumn);
                        else rowContent.push(
                            <ListColumn key={`${pid}_${col}`} right width={width} intensity={Math.tanh(item.gpu_usage_total / 100 * 2)}>
                                {(item.gpu_usage_total).toFixed(0)}% {/* item.nv_type */}
                            </ListColumn>);
                        break;
                    case "gpu-mem":
                        if (noInfo) rowContent.push(emptyColumn);
                        else rowContent.push(
                            <ListColumn key={`${pid}_${col}`} right width={width} intensity={Math.tanh(item.gpu_memory_used / 1024)}>
                                {formatBytes(item.gpu_memory_used * 1024 * 1024, 1)}
                            </ListColumn>);
                        break;
                    default:

                }
            }
        }
        return (
            <React.Fragment>
                <div ref={this.ref} key={pid} className={styles.bigRow}
                     tabIndex={selectable ? "-1" : "disabled"}>
                    <div className={styles.row}>
                        {render && rowContent}
                    </div>
                    {Object.keys(item.children).length !== 0 && !collapsed &&
                    <List key={`${pid}_children`} depth={noIndent ? depth : depth + 1}
                          items={item.children}
                          config={config}/>}
                </div>
            </React.Fragment>
        );
    }
}
