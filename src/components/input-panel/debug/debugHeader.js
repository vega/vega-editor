import React from 'react';
import './index.css';
import { connect } from 'react-redux';
const ReactDOM = require('react-dom');
import * as EditorActions from '../../../actions/editor';
import './index.css';

const toggleStyle = {
  position: 'absolute',
  bottom: 0,
  display: 'flex',
  fontSize: '12px',
  width: '100%',
  height: 25,
  backgroundColor: '#e6e6e6',
  alignItems: 'center',
  fontFamily: 'Helvetica',
};

const svgStyle = {
  position:'absolute',
  cursor: 'pointer',
  right:'50%',
  height: 25,
  width: 35
};

const toggleButtonArea = {
  right: 5,
  position: 'absolute'
};

class DebugHeader extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      value:''
    };
    this.handleChange = this.handleChange.bind(this);
  }

  handleChange(event) {
    this.props.toggleDebugMode(event.target.value);
    this.setState({value: event.target.value});
  }

  render () {
    const toggleButton = (
      <div style={toggleButtonArea} >
        <select value={this.props.debugMode} onChange={this.handleChange}>
          <option value="timeline">Timeline</option>
          <option value="data">Data</option>
        </select>
        <a href="http://vega.github.io/vega-tutorials/debugging">
          <span title="Debugging Help">Help</span>
        </a>
      </div>
    );

    if (this.props.debug) {
      const toggleStyleUp = Object.assign({}, toggleStyle, {
        position: 'static'
      });

      return (
        <div style={toggleStyleUp}>
          <span>
              &nbsp;Debugging Tools (Alpha)
          </span>
          <svg
              style={svgStyle} onClick={this.props.toggleDebug}>
              <polygon points="5,5 30,5 17.5,20" />
          </svg>
          {toggleButton}        
        </div>
      );
    } else {
      return (
        <div style={{width: '100%'}}>
          <div style={toggleStyle}>
            <span>
              &nbsp;Debugging Tools (Alpha)
            </span>
            <svg
              style={svgStyle} onClick={this.props.toggleDebug}>
              <polygon points="5,20 30,20 17.5,5" />
            </svg>
            {toggleButton}        
          </div>       
        </div>
      );
    }
   }
};

function mapStateToProps (state, ownProps) {
  return {
    debug: state.app.debug,
    mode: state.app.mode,
    debugMode: state.app.debugMode
  };
}

const mapDispatchToProps = function (dispatch) {
  return {
    toggleDebugMode: (val) => {
      dispatch(EditorActions.toggleDebugMode(val));
    },
    toggleDebug: () => {
      dispatch(EditorActions.toggleDebug());
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(DebugHeader);

