// @flow
import React, {Component} from 'react';
import deepEqual from 'deep-equal'
import {Link} from 'react-router-dom';
import styles from './List.css';
import routes from '../constants/routes';
import List from './List'


const inline = {display: 'inline-block', overflow: 'hidden', whiteSpace: 'nowrap', verticalAlign: 'middle', height: '100%', paddingTop: '0px', paddingBottom: '0px'};
const right = {textAlign: 'right'};

export default class ListItem extends Component<Props> {
    props: Props;

    constructor(props) {
        super(props);
        this.state = {
            collapsed: true
        }
    }

    shouldComponentUpdate(nextProps) {
        const {item, layout, config} = this.props;
        const result = !(deepEqual(item, nextProps.item) && deepEqual(layout, nextProps.layout) && deepEqual(config, nextProps.config));
        return result || Object.keys(item.children).length !== 0;
    }

    collapseHandler() {
        const {collapsed} = this.state;
        this.setState({collapsed: !collapsed});
    }

    render() {
        const {pid, item, depth, layout, config} = this.props;
        const {collapsed} = this.state;
        return (
            <div key={pid}>
                <div className={styles.row} tabIndex="-1">
                    <div>
                {layout.map(({col, width}) => {
                    switch (col) {
                        case "name":
                            const pad = depth * 16;
                            return (
                                <div style={{paddingLeft: `${pad}px`, width: `${width - pad}px`, ...inline}}>
                                    {Object.keys(item.children).length !== 0 ?
                                        <i className="material-icons" onClick={this.collapseHandler.bind(this)}>{collapsed ? 'arrow_right' : 'arrow_drop_down'}</i> :
                                        <div style={{...inline, paddingLeft: "16px"}}/>}
                                    {pid} {item.cmdline}
                                </div>
                            );
                        case "cpu":
                            return (<div style={{width: `${width}px`, ...inline, ...right}}>{(item.cpu_usage / 4 * 100.0).toFixed(0)}%</div>);
                        case "mem":
                            return (<div style={{width: `${width}px`, ...inline, ...right}}>{(item.mem / 1024 / 1024).toFixed(1)} MiB</div>);
                        case "disk":
                            return (<div style={{width: `${width}px`, ...inline, ...right}}>{(item.disk_total).toFixed(1)} KiB/s</div>);
                        case "net":
                            return (<div style={{width: `${width}px`, ...inline, ...right}}>{(item.net_total).toFixed(1)} KiB/s</div>);
                        case "gpu-usage":
                            return (<div style={{width: `${width}px`, ...inline, ...right}}>{(item.gpu_usage_total).toFixed(0)}% {/*item.nv_type*/}</div>);
                        case "gpu-mem":
                            return (<div style={{width: `${width}px`, ...inline, ...right}}>{(item.gpu_memory_used).toFixed(0)} MiB</div>);
                        default:
                            return;
                    }
                })}
                    </div>
                </div>
                {Object.keys(item.children).length !== 0 && !collapsed && <List key={`${pid}_children`} depth={depth + 1} items={item.children} layout={layout} config={config}/>}
            </div>
        );
    }
}
