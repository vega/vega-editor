import React from 'react';
import {connect} from 'react-redux';
import ReactFileReader from 'react-file-reader';

class DataHeader extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      panelIsOpen: true,
      userData: 0,
      beforeData: true,
      };
    this.changePanel = this.changePanel.bind(this);
    this.getDataPanel = this.getDataPanel.bind(this);
    this.handleFiles = this.handleFiles.bind(this);
    }

  handleFiles = files => {
    var reader = new FileReader();
    reader.onload = function(e) {
      var result = reader.result;
      var lines = result.split('\n');
      var columns = [];
      for (var i = 0; i < lines.length; i++){
        columns.push(lines[i].split(','));
        }
      var rowsColumns = [];
      for (var j = 1; j < columns.length; j++){
        var obj = {}
        for (var k = 0; k < columns[0].length; k++){
          var a = columns[0][k].replace('\r', '');
          var b;
          try {
            b = columns[j][k].replace('\r', '');
            }
          catch (TypeError) {
            console.warn('Dataset is incomplete');
            b = 0;
            }
          if (isNaN(parseFloat(b)) === false){
            b = parseFloat(b);
            }
          obj[a] = b;
          }
        rowsColumns.push(obj)
        }
      var toParse = rowsColumns;
      var asObject = {};
      asObject.values = toParse;
      this.props.addData(asObject);
      this.props.isData();
      var table = document.createElement('table'), tr, td, row, cell;
      for (row = 0; row < columns.length; row++) {
        tr = document.createElement('tr');
        tr.setAttribute('class', 'row1');
        for (cell = 0; cell < columns[row].length; cell++) {
          td = document.createElement('td');
          tr.appendChild(td);
          var input = document.createElement('input');
          td.appendChild(input);
          input.value = columns[row][cell];
          input.setAttribute('style', 'input1');
          input.setAttribute('class','input1'+row);
          input.addEventListener(
            'change',
            function() {
              var table = document.getElementsByClassName('row1');
              var tableParse = [];
              for (var i = 0; i < table.length; i++) {
                tableParse.push([]);
                var row = document.getElementsByClassName('input1'+i);
                var rowParse = [];
                for (var j = 0; j < row.length; j++) {
                  rowParse.push(row[j].value);
                  }
                tableParse[i].push(rowParse);
                }
              var columns = [];
              for (var m = 0; m < tableParse.length; m++){
                columns.push(tableParse[m][0]);
                }
              var rowsColumns = [];
              for (var l = 1; l < columns.length; l++){
                var obj = {}
                for (var k = 0; k < columns[l].length; k++){
                  var a = columns[0][k].replace('\r', '');
                  var b = columns[l][k].replace('\r', '');
                  if (isNaN(parseFloat(b)) === false){
                    b = parseFloat(b);
                    }
                  obj[a] = b;
                  }
                rowsColumns.push(obj);
                }
              var asObject = {};
              asObject.values = rowsColumns;
              this.props.addData(asObject);
              this.props.isData();
              }.bind(this),
            false
            );
          }
        }
      document.getElementById('TableShow').appendChild(table);
      }.bind(this)

    reader.readAsText(files[0]);
    this.props.callback()
    }

  changePanel() {
    this.setState(prevState => ({
      panelIsOpen: !prevState.panelIsOpen
    }));
    }

  getDataPanel() {
    const dataShow = [];
      if (this.state.panelIsOpen) {
        dataShow.push(<div className='data-button' onClick={this.changePanel.bind(this)} key='button'>Import Data</div>);
      } else {
          dataShow.push(
            <div key='container'>
              <div>

              </div>
              <br />
              <ReactFileReader handleFiles={this.handleFiles} fileTypes={'.csv'}>
                  <div id='UploadButton' className='data-button-2'>Choose CSV</div>
              </ReactFileReader>
              <div className='data-button' onClick={this.changePanel.bind(this)} key='button'>Clear Data</div>
            </div>
          );
        }
      return dataShow;
    }

  render() {
    const dataShow = this.getDataPanel()
      return (
        <div id='container' className='button-container'>
           {dataShow}
        </div>
      );
    }
  }

function mapStateToProps(state, ownProps) {
  return {
    value: state.data,
    panelIsOpen: state.panelIsOpen,
    changePanel: state.changePanel,
    mode: state.mode,
  };
}



export default connect(mapStateToProps)(DataHeader);

