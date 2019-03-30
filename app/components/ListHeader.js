// @flow
import React, {Component} from 'react';
import styles from './List.scss';


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
        const {width, children, sortClick, right} = this.props;
        return (
            <div className={styles.headerColumn}
                 style={{width: `${width}px`/*, backgroundColor: 'rgba(255,0,0,0.5)'*/}}>
                <div onClick={sortClick} className={styles.content}>{children}</div>
                <div ref={this.handle} className={styles.separator} onMouseDown={this.onMouseDown}/>
            </div>);
    }
}

export default class ListHeader extends Component<Props> {
    props: Props;

    componentDidMount(): void {
    }

    render() {
        const {config, headerInfo, sortClickHandler, setLayoutHandler} = this.props;
        const {layout} = config;
        const content = [];
        for (let i = 0; i < layout.length; i++) {
            const {width, col} = layout[i];
            const onResize = (w) => {
                const l = JSON.parse(JSON.stringify(layout));
                l[i] = {col: col, width: w};
                setLayoutHandler(l);
            };
            switch (col) {
                case "name":
                    content.push(<HeaderColumn key="header_name" width={width} onResize={onResize}
                                               sortClick={() => sortClickHandler("name")}>
                        <div className={styles.title} left="true">
                            <div className={styles.sortArrow}>
                                {config.sort === col && do {
                                    if (config.reverseOrder) {
                                        <i className={styles.sortArrow}>arrow_drop_down</i>
                                    } else {
                                        <i className={styles.sortArrow}>arrow_drop_up</i>
                                    }
                                }}
                            </div>
                            <div className={styles.text}> Name</div>
                        </div>
                    </HeaderColumn>);
                    break;
                case "pid":
                    content.push(<HeaderColumn key="header_pid" width={width} onResize={onResize} right
                                               sortClick={() => sortClickHandler("pid")}>
                        <div className={styles.title}>
                            <div className={styles.sortArrow}>
                                {config.sort === col && do {
                                    if (config.reverseOrder) {
                                        <i className={styles.sortArrow}>arrow_drop_down</i>
                                    } else {
                                        <i className={styles.sortArrow}>arrow_drop_up</i>
                                    }
                                }}
                            </div>
                            <div className={styles.text}>PID</div>
                        </div>
                    </HeaderColumn>);
                    break;
                case "cpu":
                    content.push(<HeaderColumn key="header_cpu" width={width} onResize={onResize} right
                                               sortClick={() => sortClickHandler("cpu")}>
                        <div className={styles.indicator}>{(headerInfo.cpu * 100.0).toFixed(0)}%</div>
                        <div className={styles.title}>
                            <div className={styles.sortArrow}>
                                {config.sort === col && do {
                                    if (config.reverseOrder) {
                                        <i className={styles.sortArrow}>arrow_drop_down</i>
                                    } else {
                                        <i className={styles.sortArrow}>arrow_drop_up</i>
                                    }
                                }}
                            </div>
                            <div className={styles.text}>CPU</div>
                        </div>
                    </HeaderColumn>);
                    break;
                case "mem":
                    content.push(<HeaderColumn key="header_mem" width={width} onResize={onResize} right
                                               sortClick={() => sortClickHandler("mem")}>
                        <div className={styles.indicator}>{(headerInfo.mem * 100.0).toFixed(0)}%</div>
                        <div className={styles.title}>
                            <div className={styles.sortArrow}>
                                {config.sort === col && do {
                                    if (config.reverseOrder) {
                                        <i className={styles.sortArrow}>arrow_drop_down</i>
                                    } else {
                                        <i className={styles.sortArrow}>arrow_drop_up</i>
                                    }
                                }}
                            </div>
                            <div className={styles.text}>Memory</div>
                        </div>
                    </HeaderColumn>);
                    break;
                case "disk":
                    content.push(<HeaderColumn key="header_disk" width={width} onResize={onResize} right
                                               sortClick={() => sortClickHandler("disk")}>
                        <div className={styles.title}>
                            <div className={styles.sortArrow}>
                                {config.sort === col && do {
                                    if (config.reverseOrder) {
                                        <i className={styles.sortArrow}>arrow_drop_down</i>
                                    } else {
                                        <i className={styles.sortArrow}>arrow_drop_up</i>
                                    }
                                }}
                            </div>
                            <div className={styles.text}>Disk</div>
                        </div>
                    </HeaderColumn>);
                    break;
                case "net":
                    content.push(<HeaderColumn key="header_net" width={width} onResize={onResize} right
                                               sortClick={() => sortClickHandler("net")}>
                        <div className={styles.title}>
                            <div className={styles.sortArrow}>
                                {config.sort === col && do {
                                    if (config.reverseOrder) {
                                        <i className={styles.sortArrow}>arrow_drop_down</i>
                                    } else {
                                        <i className={styles.sortArrow}>arrow_drop_up</i>
                                    }
                                }}
                            </div>
                            <div className={styles.text}>Network</div>
                        </div>
                    </HeaderColumn>);
                    break;
                case "gpu-usage":
                    content.push(<HeaderColumn key="header_gu" width={width} onResize={onResize} right
                                               sortClick={() => sortClickHandler("gpu-usage")}>
                        <div className={styles.title}>
                            <div className={styles.sortArrow}>
                                {config.sort === col && do {
                                    if (config.reverseOrder) {
                                        <i className={styles.sortArrow}>arrow_drop_down</i>
                                    } else {
                                        <i className={styles.sortArrow}>arrow_drop_up</i>
                                    }
                                }}
                            </div>
                            <div className={styles.text}>GPU</div>
                        </div>
                    </HeaderColumn>);
                    break;
                case "gpu-mem":
                    content.push(<HeaderColumn key="header_gm" width={width} onResize={onResize} right
                                               sortClick={() => sortClickHandler("gpu-mem")}>
                        <div className={styles.title}>
                            <div className={styles.sortArrow}>
                                {config.sort === col && do {
                                    if (config.reverseOrder) {
                                        <i className={styles.sortArrow}>arrow_drop_down</i>
                                    } else {
                                        <i className={styles.sortArrow}>arrow_drop_up</i>
                                    }
                                }}

                            </div>
                            <div className={styles.text}>GPU Memory</div>
                        </div>
                    </HeaderColumn>);
                    break;
                default:

            }
        }

        return (
            <React.Fragment>
                <div className={styles.listHeader}>
                    {content}
                </div>
                <div className={styles.listHeaderPlaceholder}/>
            </React.Fragment>
        );
    }
}
