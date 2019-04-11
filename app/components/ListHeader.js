// @flow
import React, {Component} from 'react';
import styles from './List.scss';
import {connect} from "react-redux";
import {listColResize, listSortClick} from "../actions/list";
import {calcIntensity, formatBytes} from "../utils";
import {C} from "../utils";


class HeaderColumn extends Component<Props> {
    props: Props;

    constructor(props) {
        super(props);

        this.onMouseUp = this.onMouseUp.bind(this);
        this.onMouseDown = this.onMouseDown.bind(this);
        this.onMouseMove = this.onMouseMove.bind(this);

        document.addEventListener('mouseup', () => document.removeEventListener('mousemove', this.onMouseMove));

        this.handle = React.createRef();
    }

    onMouseMove(e) {
        this.props.onResize(Math.round(Math.max(e.clientX - (this.handle.current.offsetLeft + this.handle.current.offsetWidth / 2) + this.props.width, 10)));
    }

    onMouseDown() {
        document.addEventListener('mousemove', this.onMouseMove);
    }

    onMouseUp() {
        document.removeEventListener('mousemove', this.onMouseMove);
    }

    render() {
        const {width, children, sortClick} = this.props;
        const {intensity} = this.props;
        const color = `rgba(${[255, 0, 0, intensity / 1.5].join(',')})`;
        return (
            <div className={C(styles.headerColumn, "button")}
                 style={{
                     width: `${width}px`,
                 }}>
                {do {
                    if (intensity) {
                        <div className={styles.colorIndicator} style={{
                            width: `${intensity * 100}%`,
                        }}/>
                    }
                }}
                <div onClick={sortClick} className={C(styles.content)}>
                    {children}
                </div>
                <div ref={this.handle} className={styles.separator} onMouseDown={this.onMouseDown}/>
            </div>);
    }
}

class ListHeader extends Component<Props> {
    props: Props;

    componentDidMount(): void {
    }

    render() {
        const {sortClick, colResize} = this.props;
        const {log, list, config} = this.props;

        const {layout} = list;

        const content = [];
        const calcIntensity = (x, max) => x / max;
        for (let i = 0; i < layout.length; i++) {
            const {width, col} = layout[i];
            const onResize = (w) => {
                colResize(i, w);
            };
            const sortArrow = <div className={styles.sortArrow}>
                {list.sort.col === col && do {
                    if (list.sort.reverse) {
                        <i className={styles.sortArrow}>arrow_drop_down</i>
                    } else {
                        <i className={styles.sortArrow}>arrow_drop_up</i>
                    }
                }}
            </div>;
            switch (col) {
                case "name":
                    content.push(<HeaderColumn key="header_name" width={width} onResize={onResize}
                                               sortClick={() => sortClick(col)}>
                        <div className={styles.title} left="true">
                            {sortArrow}
                            <div className={styles.text}>Name</div>
                        </div>
                    </HeaderColumn>);
                    break;
                case "pid":
                    content.push(<HeaderColumn key="header_pid" width={width} onResize={onResize}
                                               sortClick={() => sortClick(col)}>
                        <div className={styles.title}>
                            {sortArrow}
                            <div className={styles.text}>PID</div>
                        </div>
                    </HeaderColumn>);
                    break;
                case "cpu": {
                    const cpuUsage = log.sys.cpus.cpu / log.sys.ncpus;
                    content.push(<HeaderColumn key="header_cpu" width={width} onResize={onResize}
                                               intensity={calcIntensity(cpuUsage, 1)}
                                               sortClick={() => sortClick(col)}>
                        <div className={styles.indicator}>{(cpuUsage * 100.0).toFixed(0)}%</div>
                        <div className={styles.title}>
                            {sortArrow}
                            <div className={styles.text}>CPU</div>
                        </div>
                    </HeaderColumn>);
                    break;
                }
                case "mem": {
                    const memUsage = 1 - log.sys.MemAvailable / log.sys.MemTotal;
                    content.push(<HeaderColumn key="header_mem" width={width} onResize={onResize}
                                               intensity={calcIntensity(memUsage, 1)}
                                               sortClick={() => sortClick(col)}>
                        <div className={styles.indicator}>{(memUsage * 100.0).toFixed(0)}%</div>
                        <div className={styles.title}>
                            {sortArrow}
                            <div className={styles.text}>Memory</div>
                        </div>
                    </HeaderColumn>);
                    break;
                }
                case "disk": {
                    const diskUsage = Object.entries(log.sys.diskstats)
                        .filter(([name, disk]) => log.lsblk.blockdevices.find(device => device.name === name && device.type === "disk"))
                        .map(([name, disk]) => disk.usage).reduce((sum, x) => sum + x);

                    content.push(<HeaderColumn key="header_disk" width={width} onResize={onResize}
                                               intensity={calcIntensity(diskUsage, 1)}
                                               sortClick={() => sortClick(col)}>
                        <div className={styles.indicator}>{(diskUsage * 100.0).toFixed(1)}%</div>
                        <div className={styles.title}>
                            {sortArrow}
                            <div className={styles.text}>Disk</div>
                        </div>
                    </HeaderColumn>);
                    break;
                }
                case "net": {
                    const netSpeed = log.sys.net_receive_speed + log.sys.net_transmit_speed;
                    content.push(<HeaderColumn key="header_net" width={width} onResize={onResize}
                                               intensity={config.netBandwidth ?
                                                   calcIntensity(netSpeed / config.netBandwidth, 1) :
                                                   calcIntensity(netSpeed, 1024 * 1024)}
                                               sortClick={() => sortClick(col)}>
                        <div className={styles.indicator}>{config.netBandwidth ?
                            (netSpeed / config.netBandwidth * 100.0).toFixed(1) + '%' :
                            formatBytes(netSpeed, 1)}</div>
                        <div className={styles.title}>
                            {sortArrow}
                            <div className={styles.text}>Network</div>
                        </div>
                    </HeaderColumn>);
                    break;
                }
                case "gpu-usage": {
                    const gpuUsage = log.sys.nv_gpu_usage / 100;
                    content.push(<HeaderColumn key="header_gu" width={width} onResize={onResize}
                                               intensity={calcIntensity(gpuUsage, 1)}
                                               sortClick={() => sortClick(col)}>
                        <div className={styles.indicator}>{(gpuUsage * 100).toFixed(0)}%</div>
                        <div className={styles.title}>
                            {sortArrow}
                            <div className={styles.text}>GPU</div>
                        </div>
                    </HeaderColumn>);
                    break;
                }
                case "gpu-mem": {
                    const gpuMem = 1 - log.sys.gpu_memory_free / log.sys.gpu_memory_total;
                    content.push(<HeaderColumn key="header_gm" width={width} onResize={onResize}
                                               intensity={calcIntensity(gpuMem, 1)}
                                               sortClick={() => sortClick(col)}>
                        <div className={styles.indicator}>{(gpuMem * 100.0).toFixed(0)}%</div>
                        <div className={styles.title}>
                            {sortArrow}
                            <div className={styles.text}>VRAM</div>
                        </div>
                    </HeaderColumn>);
                    break;
                }
                default:

            }
        }
        content.push(
            <div key="header_placeholder" className={C(styles.headerColumn, "button")}
                 style={{
                     flex: "0 1 auto",
                     width: "100%"
                 }}>
            </div>
        );

        return (
            <div className={styles.listHeader}>
                {content}
            </div>
        );
    }
}

export default connect(state => ({
    list: state.list,
    log: state.log,
    config: state.config
}), {sortClick: listSortClick, colResize: listColResize})(ListHeader);
