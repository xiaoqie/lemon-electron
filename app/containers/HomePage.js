// @flow
import React, { Component } from 'react';
import Home from '../components/Window';
import {connect} from 'react-redux';
import gtkTheme from '../utils/import-gtk-theme'

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
    return <Home />;
  }
}
export default connect(state => ({
  log: state.log
}), null)(HomePage);
