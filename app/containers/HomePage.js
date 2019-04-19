// @flow
import React, { Component } from 'react';
import {connect} from 'react-redux';
import Window from '../components/Window';
import gtkTheme from '../utils/import-gtk-theme'
import GtkWidgetFactory from "../components/GtkWidgetFactory";

type Props = {log: any};

class HomePage extends Component<Props> {
  props: Props;

  render() {
    const {log} = this.props;
    const {processes} = log;
    // console.log(sys);
    // console.log(proc);
    if (!gtkTheme()) {
      return (<div className="loading">Initializing...</div>);
    }
    if (!processes) {
      return (<div className="loading">Connecting...</div>);
    }
    // return <GtkWidgetFactory/>;
    return <Window/>;
  }
}
export default connect(state => ({
  log: state.log
}), null)(HomePage);
