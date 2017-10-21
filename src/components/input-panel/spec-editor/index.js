import React from 'react';
import Editor from './monaco-editor';
import SplitPane from 'react-split-pane';
import {LAYOUT} from '../../../constants';
import {connect} from 'react-redux';
import './index.css'
import DataPanel from './data-panel';

class SpecEditor extends React.Component {

  constructor(props) {
    super(props);
    this.state = {userData: '', hasData: false, stopper: 0};
    }
    
  onAddData(uploadedData) {
    this.setState({userData: uploadedData});
    }
    
  onIsData() {
    this.setState({hasData: true});
    }
    
  update() {
    this.setState({hasData: true}, this.render);
    }
     
  getDataPanes() {
    const dataPanes = [
      <Editor 
        key='editor' 
        ref='editor'
        hasData={this.state.hasData} 
        addData={this.state.userData} 
        />, 
      <DataPanel 
        key='panel'
        isData={this.onIsData.bind(this)}  
        addData={this.onAddData.bind(this)} 
        callback={this.update.bind(this)}
        />
      ];
    return dataPanes;
    }
     
  render() {
    var dataPanes;
    dataPanes = this.getDataPanes();
    let outerComponent;
    if (this.props.dataPanelShow) {
        outerComponent = React.createElement(SplitPane,
        {
          split: 'horizontal',
          defaultSize: (window.innerHeight - LAYOUT.HeaderHeight) / dataPanes.length,
          pane2Style: {display: 'flex'}
        },
        dataPanes);
    } else {
      outerComponent = <div className={'full-height-wrapper'}>
        {dataPanes}
      </div>
    }
    return outerComponent;
  }
}


function mapStateToProps(state, ownProps) {
  return {
    dataPanes: state.dataPanes
  };
}

export default connect(mapStateToProps)(SpecEditor);
