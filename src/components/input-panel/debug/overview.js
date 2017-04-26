import React from 'react';
import './index.css';
import * as d3 from 'd3';

const ReactDOM = require('react-dom');

export default class Overview extends React.Component {

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



  // // When its closed
  // <DebugHeader />

  // // When its open
  // <div>
  // 	<DebugHeader>
  // 	<DebugContainer>
  // 		<Overview />
  // 		<Timeline />
  // 	</DebugContainer>
  // </div>




  render () {
    return (
      <div className="overview">
      overview
      </div>
    );
  };
};