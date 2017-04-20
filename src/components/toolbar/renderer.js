
import React from 'react';
import { MODES } from '../../constants';
import './index.css';


export default class Toolbar extends React.Component {
  static propTypes = {
    debug: React.PropTypes.bool,
    renderer: React.PropTypes.string,
    mode: React.PropTypes.string
  }

  render () {
    var debugButton;

    if (this.props.mode === MODES.Vega) {
      debugButton = (    
        <div className='debug-toggle' onClick={this.props.toggleDebug}>
          {
            this.props.debug ? 'Hide debug tools' : 'Show debug tools'
          }
        </div>
      );
    }          
   
    return (
      <div className='toolbar'>
        {debugButton}   
        <div className='renderer-toggle' onClick={this.props.cycleRenderer}>
          {
            `Renderer: ${this.props.renderer}`
          }
        </div>
      </div>
    );
  };
};
