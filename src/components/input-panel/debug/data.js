import React from 'react';
import './index.css';
import * as d3 from 'd3';
import { LAYOUT } from '../../../constants';

const ReactDOM = require('react-dom');

const containerStyle = {
  height: (window.innerHeight - LAYOUT.HeaderHeight) / 2 - LAYOUT.DebugHeaderOverviewHeight, 
  color:'red',
  overflow: 'scroll'
};

export default class Data extends React.Component {

  componentDidMount() {
    const node = ReactDOM.findDOMNode(this);
    // Modify the DOM here

    //this.svg = d3.select(node).append('svg');
  }
  
  componentWillReceiveProps(nextProps) {
    // new properties - update anything you need to update
    //this.svg
  }

  shouldComponentUpdate() {
    return false;
  }
  

  render () {
    return (
      <div style={containerStyle}>
      data
      </div>
    );
  };
};