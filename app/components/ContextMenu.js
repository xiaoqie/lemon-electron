// @flow
import React, {Component} from 'react';
import {remote} from 'electron';
import {connect} from 'react-redux';
import $ from 'jquery';
import styles from './ContextMenu.scss';
import {C, moveMenuWindowTo} from "../utils";
import gtkTheme from '../utils/import-gtk-theme'
import {exec} from 'child_process';



type Props = {};

class ContextMenu extends Component<Props> {
    props: Props;

    constructor() {
        super();
        this.state = {
            x: 0,
            y: 0
        };
        this.ref = React.createRef();
        this.onContextMenu = this::this.onContextMenu;
    }

    componentDidMount(): void {
        window.addEventListener('contextmenu', this.onContextMenu);
    }

    componentWillUnmount(): void {
        window.removeEventListener('contextmenu', this.onContextMenu);
    }

    endProcess(pid) {
        const cmd = `kill -- ${pid}`;
        const options = {
            type: 'question',
            buttons: ['Cancel', 'End'],
            defaultId: 0,
            title: 'Confirmation',
            message: `Do you want to end process ${pid}?`,
            detail: cmd,
        };
        remote.dialog.showMessageBox(options, (response) => {
            if (response === 1) {
                exec(cmd);
            }
        });
    }

    onContextMenu(e: MouseEvent): void {
        e.preventDefault();
        const {pageX: x, pageY: y} = e;
        this.setState({x, y});

        const window = $(this.ref.current);
        setImmediate(() => {
            window.show();
            moveMenuWindowTo(window, {x, y});
        });
    }

    render() {
        const {currentSelection} = this.props.list;
        const {x, y} = this.state;
        return (
            <div ref={this.ref} className="window background csd popup">
                <div className="menu decoration">
                    {!isNaN(currentSelection) && document.activeElement === document.getElementById(`row_${currentSelection}`) &&
                    <div className="menuitem vertical-center" onClick={() => this.endProcess(currentSelection)}>
                        <div className="label">
                            End Process
                        </div>
                    </div>}
                    <div className="menuitem vertical-center" onClick={() => remote.getCurrentWindow().inspectElement(x - 1, y - 1)}>
                        <div className="label">
                            Inspect Element
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default connect(state => ({list: state.list}), null)(ContextMenu);
