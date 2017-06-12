import React from 'react';

import './index.css';
import * as vega from 'vega';
import * as vl from 'vega-lite';

const getVersion = (mode) => {
  return mode === 'vega' ? vega.version : vl.version;
}

export default class Toolbar extends React.Component {
  static propTypes = {
    debug: React.PropTypes.bool,
    renderer: React.PropTypes.string
  }
  render () {
    return (
      <div className='toolbar'>
        {/*<div className='debug-toggle' onClick={this.props.toggleDebug}>
          {
            this.props.debug ? 'Hide debug tools' : 'Show debug tools'
          }
        </div>*/}
        <div className='status'>
          {
            `Mode: ${this.props.mode}  Version: ${getVersion(this.props.mode)}`
          }
        </div>
        <div className='renderer-toggle' onClick={this.props.cycleRenderer}>
          {
            `Renderer: ${this.props.renderer}`
          }
        </div>
      </div>
    );
  };
};
