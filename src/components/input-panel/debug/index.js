import React from 'react';
import './index.css'

const ReactDOM = require('react-dom');

export default class Debug extends React.Component {

	componentDidMount() {
    const node = ReactDOM.findDOMNode(this);
    // Modify the DOM here
  }
  
  componentWillReceiveProps(nextProps) {
    // new properties - update anything you need to update
  }

  shouldComponentUpdate() {
    return false;
  }

  render () {
    return (
      <div className="debug-panel">debug</div>
    );
  };
};


// class CustomComponent extends React.component {
//   componentDidMount() {
//     const node = ReactDOM.findDOMNode(this);
//     // Modify the DOM here
//   }

//   componentWillReceiveProps(nextProps) {
//     // new properties - update anything you need to update
//   }

//   shouldComponentUpdate() {
//     return false;
//   }

//   render() {
//     const { className, style } = this.props;
//     return React.createElement('div', { className, style });
//   }
// }