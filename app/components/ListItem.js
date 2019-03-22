// @flow
import React, {Component} from 'react';
import deepEqual from 'deep-equal'
import styles from './List.scss';
import List from './List'
import {getIcon} from "../utils/gnome";
import {getDisplayName} from "../utils/name";


const inline = {
    display: 'inline-block',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
    height: '100%',
    lineHeight: '32px'
};
const right = {textAlign: 'right'};

class ListColumn extends Component<Props> {
    props: Props;

    shouldComponentUpdate(nextProps: Readonly<P>, nextState: Readonly<S>, nextContext: any): boolean {
        const {children, width} = this.props;
        // if (!this.props.right) { // FIXME not a proper condition for `name`
        //     return width !== nextProps.width;
        // }
        return !deepEqual(children, nextProps.children) || width !== nextProps.width;
    }

    render() {
        const {width, children} = this.props;
        return (
            <div className={styles.headerColumn} style={{width: `${width}px`, ...(this.props.right ? right : {})}}>
                <span className={styles.columnText}>{children}</span>
                <div className={styles.columnSeparator}/>
            </div>);
    }
}

export default class ListItem extends Component<Props> {
    props: Props;

    constructor(props) {
        super(props);
        const {item} = props;
        this.collapseHandler = this.collapseHandler.bind(this);
        this.state = {
            collapsed: item.type === 'service' || item.type === 'group' ? false : true
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        const {item, layout, config} = this.props;
        const {collapsed} = this.state;
        const result = deepEqual(item, nextProps.item) && deepEqual(layout, nextProps.layout) && deepEqual(config, nextProps.config) && collapsed === nextState.collapsed;
        return !result;
    }

    collapseHandler() {
        const {collapsed} = this.state;
        this.setState({collapsed: !collapsed});
    }

    render() {
        const {pid, item, depth, layout, config} = this.props;
        const {collapsed} = this.state;
        return (
            <div key={pid} className={styles.bigRow} tabIndex="-1">
                <div className={styles.row}>
                    {layout.map(({col, width}) => {
                        const pad = depth * parseInt(styles.arrowSize);
                        switch (col) {
                            case "name":
                                return (
                                    <ListColumn key={`${pid}_${col}`} width={width}>
                                        <div style={{paddingLeft: `${pad}px`, width: `${width - pad}px`, ...inline}}>
                                            {
                                                Object.keys(item.children).length !== 0 && item.type !== 'service'
                                                    ?
                                                    <i className="material-icons" onClick={this.collapseHandler}>
                                                        {collapsed ? 'arrow_right' : 'arrow_drop_down'}
                                                    </i>
                                                    :
                                                    <div style={{...inline, paddingLeft: styles.arrowSize}}/>
                                            }
                                            <img src={getIcon(item)} alt="" className={styles.icon}/>
                                            <span style={inline} title={item.cmdline}>{getDisplayName(item)}</span>
                                        </div>
                                    </ListColumn>
                                );
                            case "pid":
                                if (item.type === 'group') return;
                                return (
                                    <ListColumn key={`${pid}_${col}`} right width={width}>
                                        {pid}
                                    </ListColumn> );
                            case "cpu":
                                if (item.type === 'group') return;
                                return (
                                    <ListColumn key={`${pid}_${col}`} right width={width}>
                                        {(item.cpu_usage / 4 * 100.0).toFixed(0)}%
                                    </ListColumn>);
                            case "mem":
                                if (item.type === 'group') return;
                                return (
                                    <ListColumn key={`${pid}_${col}`} right width={width}>
                                        {(item.mem / 1024 / 1024).toFixed(1)} MiB
                                    </ListColumn>);
                            case "disk":
                                if (item.type === 'group') return;
                                return (
                                    <ListColumn key={`${pid}_${col}`} right width={width}>
                                        {(item.disk_total).toFixed(1)} KiB/s
                                    </ListColumn>);
                            case "net":
                                if (item.type === 'group') return;
                                return (
                                    <ListColumn key={`${pid}_${col}`} right width={width}>
                                        {(item.net_total).toFixed(1)} KiB/s
                                    </ListColumn>);
                            case "gpu-usage":
                                if (item.type === 'group') return;
                                return (
                                    <ListColumn key={`${pid}_${col}`} right width={width}>
                                        {(item.gpu_usage_total).toFixed(0)}% {/* item.nv_type */}
                                    </ListColumn>);
                            case "gpu-mem":
                                if (item.type === 'group') return;
                                return (
                                    <ListColumn key={`${pid}_${col}`} right width={width}>
                                        {(item.gpu_memory_used).toFixed(0)} MiB
                                    </ListColumn>);
                            default:

                        }
                    })}
                </div>
                {Object.keys(item.children).length !== 0 && !collapsed &&
                <List key={`${pid}_children`} depth={depth + 1} items={item.children} layout={layout} config={config}/>}
            </div>
        );
    }
}
