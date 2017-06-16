import React from 'react';

import './index.css';

export default class ErrorPane extends React.Component {
  render() {
    if ((this.props.error != null || this.props.warningsLogger.warns.length > 0) && this.props.errorPane) {
      let list = [];
      let warnings = this.props.warningsLogger.warns;
      if (warnings.length > 0) {
        for (let i = 0; i < warnings.length; i++) {
          list.push(<li key={i}><span className='warnings'>[Warning] </span>{warnings[i]}</li>);
        }
      }
      if (this.props.error) {
        list.push(<li key={warnings.length}><span className='error'>[Error] </span>{this.props.error}</li>);
      } 
      return (
        <div>
          <ul>
            {list}
          </ul>
        </div>
      );
    } else {
      return null;
    }
  }
}