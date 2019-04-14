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
        const {list, height} = this.props;
        const {listItems} = list;
        if (!listItems) return null;
        return listItems.map((item, i) => {
            const itemHeight = 32;
            const top = itemHeight * i - list.scroll;
            if (top > -itemHeight && top < height) {
                return <div style={{"top": top}}>
                    <ListItem key={item.pid} item={item} depth={item.depth}/>
                </div>
            }
            return null;
        });
    }
}

export default connect(state => ({
    list: state.list
}))(List);
