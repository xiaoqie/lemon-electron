// @flow
import React, {Component} from 'react';
import {Link} from 'react-router-dom';
import {spawn} from 'child_process';
import styles from './List.scss';
import routes from '../constants/routes';
import ListItem from "./ListItem";
import {getDisplayName} from "../utils/name";
import {connect} from "react-redux";
import {stringCompare} from "../utils";


class List extends Component<Props> {
    props: Props;

    render() {
        const {list} = this.props;
        const {listItems} = list;
        if (!listItems) return null;
        return listItems.map(item => <ListItem key={item.pid} item={item} depth={item.depth}/>);
    }
}

export default connect(state => ({
    list: state.list
}))(List);
