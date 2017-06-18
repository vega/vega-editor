import React from 'react';
import Portal from 'react-portal';
import { MODES, SPECS, LAYOUT } from '../../constants';
import './index.css';
import { hashHistory } from 'react-router';

const formatExampleName = (name) => {
  return name.split(/[_\-]/).map(i => i[0].toUpperCase() + i.substring(1)).join(' ');
}

export default class Header extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showVega: props.mode === MODES.Vega,
      url: '',
      filename: '',
      description: ''
    };
    this.onSelectVega = this.onSelectVega.bind(this);
  }

  handleChange(event) {
    this.setState({url: event.target.value});
  }

  handleFilenameChange(event) {
    this.setState({filename: event.target.value});
  }

  handleDesChange(event) {
    this.setState({description: event.target.value});
  }

  onSelectVega (name) {
    this.setState({
      exampleIsOpened: false
    });
    hashHistory.push('/examples/vega/' + name);
  }

  onSelectVegaLite (name) {
    this.setState({
      exampleIsOpened: false
    });
    hashHistory.push('/examples/vega-lite/' + name);
  }

  postData(filename, description) {
    this.setState({
      saveIsOpened: true
    })
    fetch('https://hook.io/tianyiii/create-in-gist/' + filename + '/' + description, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        spec: this.props.editorString,
      })
    }).then((response) => {
      this.setState({
        saveIsOpened: false,
        url: ''
      })
      return response.json();
    }).then((value) => {
      let arrayNames = value[filename].raw_url.split('/');
      let id = arrayNames[4];
      hashHistory.push('/gist/' + this.props.mode +'/anonymous/' + id);
    })
  }

  render () {
    const saveInGistButton = (
      <div className='button'
        onClick={(e) => {
          this.postData(`${this.props.mode}-spec.json`, 'vega-editor-generated-gist');
        }}>
        {'Save'}
      </div>
    );

    const examplesButton = (
      <div className='button'
        onClick={(e) => {
          this.setState({
            exampleIsOpened: true
          });
        }}>
        {'Examples'}
      </div>
    );

    const gistButton = (
      <div className='button'
        onClick={(e) => {
          this.setState({
            gistIsOpened: true
          });
        }}>
        {'Load'}
      </div>
    );

    const docsLink = (
      <a className='button right' href={this.props.mode === MODES.Vega ? 'https://vega.github.io/vega/docs/' : 'https://vega.github.io/vega-lite/docs/'} target="_blank">
        {formatExampleName(this.props.mode)} Docs
      </a>
    );

    const customButton = (
      <div
        onMouseOver={(e) => {
          const targetRect = e.target.getBoundingClientRect();
          this.setState({
            customIsOpened: true,
            left: targetRect.left
          });
        }}>
        {'New'}
      </div>
    )

    const vega = (
      <div className="vega">
        {
            Object.keys(SPECS.Vega).map((specType, i) => {
              const specs = SPECS.Vega[specType];
              return (
                <div className='itemGroup' key={i}>
                  <div className='specType'>{specType}</div>
                  <div className='items'>
                    {
                      specs.map((spec, j) => {
                        return (
                          <div key={j} onClick={() => this.onSelectVega(spec.name)} className='item'>
                            <div style={{backgroundImage: `url(images/examples/vg/${spec.name}.vg.png)` }} className='img' />
                            <div className='name'>{formatExampleName(spec.name)}</div>
                          </div>
                        )
                      })
                    }
                  </div>
                </div>
              );
            })
        }
      </div>
    );

    const vegalite = (
      <div className="vega-Lite">
        {
          Object.keys(SPECS.VegaLite).map((specType, i) => {
            const specs = SPECS.VegaLite[specType];
            return (
              <div className='itemGroup' key={i}>
                <div className='specType'>{specType}</div>
                <div className='items'>
                  {
                    specs.map((spec, j) => {
                      return (
                        <div key={j} onClick={() => this.onSelectVegaLite(spec.name)} className='item'>
                          <div style={{backgroundImage: `url(images/examples/vl/${spec.name}.vl.png)` }} className='img' />
                          <div className='name'>{spec.title}</div>
                        </div>
                      )
                    })
                  }
                </div>
              </div>
            );
          })
        }
      </div>
    );

    const gist = (
      <div>
        <header>Enter Gist URL: </header>
        <div className='gist-content'>
          <div className='gist-text'>For example</div>
          <div className='gist-url'>https://gist.github.com/mathisonian/542616c4af5606784e97e59e3c65b7e5</div>

          <input className='gist-input' type='text' placeholder='enter gist url here' value={this.state.url}
          onChange={this.handleChange.bind(this)}/>

          <button className='gist-button' onClick={() => {
            this.props.setGistVega(this.state.url);
            this.setState({
              gistIsOpened: false,
              url: ''
            })
          }}> Vega
          </button>
          <button className='gist-button' onClick={() => {
            this.props.setGistVegaLite(this.state.url);
            this.setState({
              gistIsOpened: false,
              url: ''
              });
            }}> Vega-Lite
          </button>
        </div>
      </div>
    );

    const saveGist = (
      <div>
        <div className='save-gist-content'>
          Saving gist... please wait...
        </div>
      </div>
    );

    return (
        <div className='header'>
          <a className="idl-logo" href="https://idl.cs.washington.edu/" target="_blank">
            <img height={37} alt="IDL Logo" src="https://vega.github.io/images/idl-logo.png" />
          </a>
          {examplesButton}
          {customButton}
          {gistButton}
          {docsLink}
          {saveInGistButton}

        <Portal
          closeOnEsc
          closeOnOutsideClick
          isOpened={this.state.customIsOpened}
          onClose={() => { this.setState({ customIsOpened: false});}}
        >

          <div className='customSubmenuGroup' onMouseOver={() => { this.setState({ customIsOpened: true});}}
            onMouseLeave={() => { this.setState({ customIsOpened: false});}} onClick={() => { this.setState({ customIsOpened: false});}}
            style={{
              left:this.state.left,
              width:this.state.width,
              position: 'absolute',
              cursor: 'pointer',
              zIndex: 1000000000,
              top: 0
            }} >

            <div id="emptyButton" style={{height:LAYOUT.HeaderHeight}}></div>

            <div className='customSubmenu' onClick={() => this.onSelectVega('custom')}>
              {'Vega'}
            </div>
            <div className='customSubmenu' onClick={() => this.onSelectVegaLite('custom')}>
              {'Vega-Lite'}
            </div>
          </div>
        </Portal>

        <Portal
          closeOnEsc
          isOpened={this.state.exampleIsOpened}
          onClose={() => { this.setState({ exampleIsOpened: false});}}
        >
          <div className='modal-background'>
            <div className='modal-header'>
              <div className='button-groups'>
                <button className={this.state.showVega ? 'selected' : ''} onClick={() => { this.setState({ showVega: true });}}>{'Vega'}</button>
                <button className={this.state.showVega ? '' : 'selected'} onClick={() => { this.setState({ showVega: false });}}>{'Vega-Lite'}</button>
              </div>

              <button className='close-button' onClick={() => {this.setState({ exampleIsOpened: false });}}>✖</button>
            </div>
            <div className='modal-area'>
              <div className='modal'>
                { this.state.showVega ? vega : vegalite }
              </div>
            </div>
          </div>
        </Portal>

        <Portal
          closeOnOutsideClick={true}
          closeOnEsc
          isOpened={this.state.saveIsOpened}
          onClose={() => { this.setState({ saveIsOpened: false});}}
        >
        <div className='modal-background'>
          <div className='modal-header'>
            <button className='close-button' onClick={() => {this.setState({ saveIsOpened: false });}}>✖</button>
          </div>
          <div className='modal-area'>
            <div className='modal'>
              {saveGist}
            </div>
          </div>
        </div>
      </Portal>

        <Portal
          closeOnOutsideClick={true}
          closeOnEsc
          isOpened={this.state.gistIsOpened}
          onClose={() => { this.setState({ gistIsOpened: false});}}
        >
        <div className='modal-background'>
          <div className='modal-header'>
            <button className='close-button' onClick={() => {this.setState({ gistIsOpened: false });}}>✖</button>
          </div>
          <div className='modal-area'>
            <div className='modal'>
              {gist}
            </div>
          </div>
        </div>
        </Portal>
      </div>

    );
  };
};
