import React from 'react';
import {MODES} from '../../../../constants';
import MonacoEditor from 'react-monaco-editor-plus';
import {hashHistory} from 'react-router';
import parser from 'vega-schema-url-parser';

import './index.css'

const vegaSchema = require('../../../../../schema/vega.schema.json');
const vegaLiteSchema = require('../../../../../schema/vl.schema.json');

const schemas = {
  [MODES.Vega]: {
    uri: 'https://vega.github.io/schema/vega/v3.0.json',
    schema: vegaSchema,
    fileMatch: ['*']
  }, [MODES.VegaLite]: {
    uri: 'https://vega.github.io/schema/vega-lite/v2.json',
    schema: vegaLiteSchema,
    fileMatch: ['*']
  }
};


function debounce(func, wait, immediate) {
	let timeout;
	return function() {
		const context = this, args = arguments;
		const later = () => {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		const callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
  }


export default class Editor extends React.Component {

  constructor(props){
    super(props);
    this.state = {shownCall: JSON.stringify(JSON.parse(this.props.value), null, '  '), first:true};
  }

  static propTypes = {
    value: React.PropTypes.string,
    onChange: React.PropTypes.func
  }

  callback() {
      this.props.parseSpec(true)
      this.setState({isEdited: false})
    }

  handleEditorChange(spec) {


    if (this.props.hasData) {
      if (this.state.first) {

      var editSpec = JSON.parse(this.props.value,null,'  ');
      editSpec.data = {'url': 'userData'};

    try { editSpec.encoding.x.field = '...';} catch (TypeError) {
      // eslint-disable-next-line
      true; }
    try { editSpec.encoding.y.field  = '...';} catch (TypeError) {
      // eslint-disable-next-line
      true; }
    try { editSpec.encoding.size.field = '...';} catch (TypeError) {
      // eslint-disable-next-line
      true; }
    try { editSpec.encoding.shape.field = '...';} catch (TypeError) {
      // eslint-disable-next-line
      true; }
    try { editSpec.encoding.column.field = '...'; } catch (TypeError) {
      // eslint-disable-next-line
      true; }
    try { editSpec.encoding.color.field = '...';} catch (TypeError) {
      // eslint-disable-next-line
      true; }
    try { editSpec.encoding.x.type = '...';} catch (TypeError) {
      // eslint-disable-next-line
      true; }
    try { editSpec.encoding.y.type = '...';} catch (TypeError) {
      // eslint-disable-next-line
      true; }
    try { editSpec.transform = '...';} catch (TypeError) {
      // eslint-disable-next-line
      true; }
    try { editSpec.encoding.x.axis.title = '...';} catch (TypeError) {
      // eslint-disable-next-line
      true; }
    try { editSpec.encoding.y.axis.title = '...';} catch (TypeError) {
      // eslint-disable-next-line
      true; }
    try { editSpec.encoding.color.type = '...';} catch (TypeError) {
      // eslint-disable-next-line
      true; }

      this.setState({first: false});
      var finalSpec = JSON.stringify(editSpec,null,'  ');
      } else {
              // eslint-disable-next-line
        var finalSpec = JSON.stringify(spec,null,'  ');
        }

      var editSpec2 = JSON.parse(spec);
      editSpec2.data = this.props.addData;
      var finalSpec2 = JSON.stringify(editSpec2,null,'  ');
      if (this.props.autoParse) {
        this.updateSpec(finalSpec2);
        } else {
        this.props.updateEditorString(finalSpec2);
        this.setState({shownCall: finalSpec2})
        }
      if (hashHistory.getCurrentLocation().pathname.indexOf('/edited') === -1) {
        hashHistory.push('/edited');
        }
      this.setState({shownCall: JSON.parse(finalSpec)});
    } else {
      if (this.props.autoParse) {
        this.updateSpec(spec);
      } else {
        this.props.updateEditorString(spec);
        this.setState({shownCall: spec})
      }
      if (hashHistory.getCurrentLocation().pathname.indexOf('/edited') === -1) {
        hashHistory.push('/edited');
      }
    }

  this.setState({isEdited: true})

  }


  componentWillUpdate() {
    if (this.props.hasData) {
      if (this.state.first) {
      var editSpec = JSON.parse(this.props.value,null,'  ');
      try {
        editSpec.data = {'url': 'userData'};
      } catch (TypeError) {
        // eslint-disable-next-line
        true;
      }
      try { editSpec.encoding.x.field = '...';} catch (TypeError) {
      // eslint-disable-next-line
      true; }
      try { editSpec.encoding.y.field  = '...';} catch (TypeError) {
      // eslint-disable-next-line
      true; }
      try { editSpec.encoding.size.field = '...';} catch (TypeError) {
      // eslint-disable-next-line
      true; }
      try { editSpec.encoding.shape.field = '...';} catch (TypeError) {
      // eslint-disable-next-line
      true; }
      try { editSpec.encoding.column.field = '...'; } catch (TypeError) {
      // eslint-disable-next-line
      true; }
      try { editSpec.encoding.color.field = '...';} catch (TypeError) {
      // eslint-disable-next-line
      true; }
      try { editSpec.encoding.x.type = '...';} catch (TypeError) {
      // eslint-disable-next-line
      true; }
      try { editSpec.encoding.y.type = '...';} catch (TypeError) {
      // eslint-disable-next-line
      true; }
      try { editSpec.encoding.x.axis.title = '...';} catch (TypeError) {
      // eslint-disable-next-line
      true; }
      try { editSpec.encoding.y.axis.title = '...';} catch (TypeError) {
      // eslint-disable-next-line
      true; }
      try { editSpec.encoding.color.type = '...';} catch (TypeError) {
      // eslint-disable-next-line
      true;
      this.setState({isEdited: true})
      }

      var finalSpec = JSON.stringify(editSpec,null,'  ');
      this.setState({shownCall: finalSpec});
      this.setState({first: false});
      }
    }}


  editorWillMount(monaco) {
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: true,
      schemas: [schemas[this.props.mode]]
    });
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.autoParse && nextProps.parse) {
      this.updateSpec(nextProps.value);
      this.props.parseSpec(false);
    }
  }



  updateSpec(spec) {
    let schema, parsedMode;
    try {
      schema = JSON.parse(spec).$schema;
    } catch (err) {
      console.warn('Error parsing json string');
    }
    if (schema) {
      parsedMode = parser(schema).library;
    }
    if (parsedMode === MODES.Vega || (!parsedMode && this.props.mode === MODES.Vega)) {
      this.props.updateVegaSpec(spec);
    } else if (parsedMode === MODES.VegaLite || (!parsedMode && this.props.mode === MODES.VegaLite)) {
      this.props.updateVegaLiteSpec(spec);
    }
  }


  render() {
    return (
      <div className={'full-height-wrapper'}>
        <MonacoEditor
          language='json'
          key={JSON.stringify(Object.assign({}, this.state, {mode: this.props.mode, selectedExample: this.props.selectedExample,
            gist: this.props.gist}))}
          options={{
            folding: true,
            scrollBeyondLastLine: true,
            wordWrap: true,
            wrappingIndent: 'same',
            automaticLayout: true,
            autoIndent: true,
            cursorBlinking: 'smooth',
            lineNumbersMinChars: 4
          }}
          defaultValue={this.state.shownCall}
          onChange={debounce(this.handleEditorChange, 700).bind(this)}
          editorWillMount={this.editorWillMount.bind(this)}
        />

      </div>
    );
  }
}
