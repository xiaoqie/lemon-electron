// @flow
import React, {Component} from 'react';
import styles from './List.scss';

const right = {textAlign: 'right'};

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
        return (
            <div className={styles.headerColumn} style={{width: `${width}px`, ...right}}>
                <span onClick={sortClick} className={styles.columnText} style={right}>{children}</span>
                <div ref={this.handle} className={styles.headerHandle} onMouseDown={this.onMouseDown}/>
            </div>);
    }
}

export default class ListHeader extends Component<Props> {
    props: Props;

    componentDidMount(): void {
    }

    render() {
        const {layout, config, sortClickHandler, setLayoutHandler} = this.props;
        return (
            <div className={styles.row}>
                {layout.map(({col, width}, i) => {
                    const onResize = (w) => {
                        const l = JSON.parse(JSON.stringify(layout));
                        l[i] = {col: col, width: w};
                        setLayoutHandler(l);
                    };
                    switch (col) {
                        case "name":
                            return (<HeaderColumn key="header_name" width={width} onResize={onResize} sortClick={() => sortClickHandler("name")}>
                                Name
                            </HeaderColumn>);
                        case "pid":
                            return (<HeaderColumn key="header_pid" width={width} onResize={onResize} sortClick={() => sortClickHandler("pid")}>
                                PID
                            </HeaderColumn>);
                        case "cpu":
                            return (<HeaderColumn key="header_cpu" width={width} onResize={onResize} sortClick={() => sortClickHandler("cpu")}>
                                CPU %
                            </HeaderColumn>);
                        case "mem":
                            return (<HeaderColumn key="header_mem" width={width} onResize={onResize} sortClick={() => sortClickHandler("mem")}>
                                Memory
                            </HeaderColumn>);
                        case "disk":
                            return (<HeaderColumn key="header_disk" width={width} onResize={onResize} sortClick={() => sortClickHandler("disk")}>
                                Disk
                            </HeaderColumn>);
                        case "net":
                            return (<HeaderColumn key="header_net" width={width} onResize={onResize} sortClick={() => sortClickHandler("net")}>
                                Network
                            </HeaderColumn>);
                        case "gpu-usage":
                            return (<HeaderColumn key="header_gu" width={width} onResize={onResize} sortClick={() => sortClickHandler("gpu-usage")}>
                                GPU Usage
                            </HeaderColumn>);
                        case "gpu-mem":
                            return (<HeaderColumn key="header_gm" width={width} onResize={onResize} sortClick={() => sortClickHandler("gpu-mem")}>
                                GPU Memory
                            </HeaderColumn>);
                        default:

                    }
                })}
            </div>
        );
    }
}
