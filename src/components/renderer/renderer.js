import React from 'react';
import PropTypes from 'prop-types';
import * as vega from 'vega';
import 'vega-tooltip/build/vega-tooltip.css';
import './index.css';
import Vega from '../../constants'
import * as vegaTooltip from 'vega-tooltip';
import Error from '../error';
import ErrorPane from '../error-pane';
import Toolbar from '../toolbar';
import SplitPane from 'react-split-pane';
import {LAYOUT} from '../../constants';

export default class Editor extends React.Component {
  static propTypes = {
    vegaSpec: PropTypes.object,
    renderer: PropTypes.string,
    mode: PropTypes.string
  }

  renderVega (props) {
    this.refs.chart.style.width = this.refs.chart.getBoundingClientRect().width + 'px';
    let runtime;
    let view;
    try {
      runtime = vega.parse(props.vegaSpec);
      view = new vega.View(runtime)
      .logLevel(vega.Warn)
      .initialize(this.refs.chart)
      .renderer(props.renderer)
    
      if (props.mode === Vega) {
        view.hover()
      }
      view.run();
    } catch (err) {
      this.props.logError(err.toString());
    }
    this.refs.chart.style.width = 'auto';
    vegaTooltip.vega(view);
    window.VEGA_DEBUG.view = view;
  }

  componentDidMount () {
    this.renderVega(this.props);
  }

  componentWillReceiveProps (nextProps) {
    this.renderVega(nextProps);
  }

  renderChart() {
    return (
      <div className='chart-container'>
        <Error />
        <div className='chart'>
          <div ref='chart'>
          </div>
          <div id='vis-tooltip' className='vg-tooltip'>
          </div>
        </div>
        <Toolbar />
      </div>
    );
  }

  render () {
    const splitSize = localStorage.getItem('splitPos');
    const hideSize = localStorage.getItem('hideSplitPos');
    const fullScreenSize = window.innerHeight - LAYOUT.HeaderHeight;
    let onChange, size;
    if (this.props.errorPane) {
      if (!splitSize) {
        localStorage.setItem('splitPos', window.innerHeight * 0.6)
      }
      onChange = size => localStorage.setItem('splitPos', size);
      size = parseInt(splitSize, 10);
    } else if (!this.props.errorPane) {
      localStorage.setItem('hideSplitPos', fullScreenSize);
      onChange = size => localStorage.setItem('hideSplitPos', size)
      size = parseInt(hideSize, 10);
    }
    return ( 
      <SplitPane split='horizontal' size={size} onChange={onChange}>
        {this.renderChart()}
        <ErrorPane />
      </SplitPane>
    );
  }
}
