// @flow
import React, {Component} from 'react';
import {remote} from 'electron';
import {connect} from 'react-redux';
import {exec} from 'child_process';
import styles from './ContextMenu.scss';
import {C, moveMenuWindowTo} from "../utils";
import gtkTheme from '../utils/import-gtk-theme'


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
        this.onMouseDown = this::this.onMouseDown;
        this.onClick = this::this.onClick;
        this.onWheel = this::this.onWheel;
    }

    componentDidMount(): void {
        window.addEventListener('contextmenu', this.onContextMenu);
        window.addEventListener('mouseup', this.onClick);
        window.addEventListener("wheel", this.onWheel);
        window.addEventListener('mousedown', this.onMouseDown);
    }

    componentWillUnmount(): void {
        window.removeEventListener('contextmenu', this.onContextMenu);
        window.removeEventListener('mouseup', this.onClick);
        window.removeEventListener("wheel", this.onWheel);
        window.removeEventListener('mousedown', this.onMouseDown);
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

        this.ref.current.style.display = 'block';
        moveMenuWindowTo(this.ref.current, {x, y});
    }

    onMouseDown(e: MouseEvent): void {
        if (e.button !== 2 && !this.ref.current.contains(e.target)) {
            this.ref.current.style.display = 'none';
        }
    }

    onClick(e: MouseEvent): void {
        if (e.button !== 2) {
            this.ref.current.style.display = 'none';
        }
    }

    onWheel(): void {
        this.ref.current.style.display = 'none';
    }

    render() {
        const {currentSelection} = this.props.list;
        const {x, y} = this.state;
        return (
            <div ref={this.ref} className="window background csd popup">
                <div className="menu decoration">
                    {!isNaN(currentSelection) && document.activeElement === document.getElementById(`row_${currentSelection}`) &&
                    <div className="menuitem vertical-center horizontal"
                         onClick={() => this.endProcess(currentSelection)}>
                        <div className="pre-label"/>
                        <div className="label">
                            End Process
                        </div>
                        <div className="after-label"/>
                    </div>}
                    <div className="menuitem vertical-center horizontal"
                         onClick={() => remote.getCurrentWindow().inspectElement(x, y)}>
                        <div className="pre-label"/>
                        <div className="label">
                            Inspect Element
                        </div>
                        <div className="after-label"/>
                    </div>
                </div>
            </div>
        );
    }
}

export default connect(state => ({list: state.list}), null)(ContextMenu);
