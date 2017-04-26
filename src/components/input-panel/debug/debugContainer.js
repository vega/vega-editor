import React from 'react';
import './index.css';
import * as d3 from 'd3';
import Overview from './overview';
import Timeline from './timeline';
import Data from './data';
import { connect } from 'react-redux';
import { LAYOUT } from '../../../constants';

const ReactDOM = require('react-dom');

function mapStateToProps (state, ownProps) {
  return {
    debugMode: state.app.debugMode
  };
}

class DebugContainer extends React.Component {

  //var height = window.innerHeight - LAYOUT.HeaderHeight;
  //console.log(window.innerHeight - LAYOUT.HeaderHeight);

  render () {
    console.log(this.props);
    if (this.props.debugMode === 'timeline') {
      return (
        <div>
          <Overview />
          <Timeline />
        </div>
      );
    } else {     // data
      return (
        <div>
          <Overview />
          <Data />
        </div>
      );
    }
  };
};


export default connect(mapStateToProps, null)(DebugContainer);