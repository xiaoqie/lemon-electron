// @flow
import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import styles from './Counter.css';
import routes from '../constants/routes';
import List from './List'


const inline = {display: 'inline-block', overflow: 'hidden', whiteSpace: 'nowrap'};
const right = {textAlign: 'right'}

export default class ListHeader extends Component<Props> {
    props: Props;

    render() {
        const {layout, config, sortClickHandler} = this.props;
        return (
            <div>
                {layout.map(({col, width}) => {
                    switch (col) {
                        case "name":
                            return (<div style={{width: `${width}px`, ...inline}}>Name</div>);
                        case "cpu":
                            return (<div style={{width: `${width}px`, ...inline, ...right}} onClick={() => sortClickHandler("cpu")}>CPU %</div>);
                        case "mem":
                            return (<div style={{width: `${width}px`, ...inline, ...right}} onClick={() => sortClickHandler("mem")}>Memory</div>);
                        case "disk":
                            return (<div style={{width: `${width}px`, ...inline, ...right}} onClick={() => sortClickHandler("disk")}>Disk</div>);
                        case "net":
                            return (<div style={{width: `${width}px`, ...inline, ...right}} onClick={() => sortClickHandler("net")}>Network</div>);
                        case "gpu-usage":
                            return (<div style={{width: `${width}px`, ...inline, ...right}} onClick={() => sortClickHandler("gpu-usage")}>GPU Usage</div>);
                        case "gpu-mem":
                            return (<div style={{width: `${width}px`, ...inline, ...right}} onClick={() => sortClickHandler("gpu-mem")}>GPU Memory</div>);
                        default:
                            
                    }
                })}
            </div>
        );
    }
}
