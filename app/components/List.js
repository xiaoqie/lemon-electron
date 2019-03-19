// @flow
import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import {spawn} from 'child_process';
import styles from './List.css';
import routes from '../constants/routes';
import ListItem from "./ListItem";

export default class List extends Component<Props> {
    props: Props;

    render() {
        const {items, depth, layout, config} = this.props;
        const {sort, reverseOrder} = config;
        if (Object.keys(items).length === 0) {
            return null;
        }
        let pid = Object.keys(items);
        switch (sort) {
            case "name":
                break;
            case "cpu":
                pid = Object.keys(items).sort((pid1, pid2) =>
                    (reverseOrder ? -1 : 1) * (items[pid1].cpu_usage - items[pid2].cpu_usage));
                break;
            case "mem":
                pid = Object.keys(items).sort((pid1, pid2) =>
                    (reverseOrder ? -1 : 1) * (items[pid1].mem - items[pid2].mem));
                break;
            case "disk":
                pid = Object.keys(items).sort((pid1, pid2) =>
                    (reverseOrder ? -1 : 1) * (items[pid1].disk_total - items[pid2].disk_total));
                break;
            case "net":
                pid = Object.keys(items).sort((pid1, pid2) =>
                (reverseOrder ? -1 : 1) * (items[pid1].net_total - items[pid2].net_total));
                break;
            case "gpu-usage":
                pid = Object.keys(items).sort((pid1, pid2) =>
                    (reverseOrder ? -1 : 1) * (items[pid1].gpu_usage_total - items[pid2].gpu_usage_total));
                break;
            case "gpu-mem":
                pid = Object.keys(items).sort((pid1, pid2) =>
                    (reverseOrder ? -1 : 1) * (items[pid1].gpu_memory_used - items[pid2].gpu_memory_used));
                break;
            default:
                break;
        }
        return pid.map((pid) => (
            <ListItem key={pid} pid={pid} item={items[pid]} depth={depth} layout={layout} config={config}/>
        ));
    }
}
