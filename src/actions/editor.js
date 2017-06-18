export const UPDATE_VEGA_SPEC = 'UPDATE_VEGA_SPEC';
export const UPDATE_VEGA_LITE_SPEC = 'UPDATE_VEGA_LITE_SPEC';
export const PARSE_SPEC = 'PARSE_SPEC';
export const SET_VEGA_EXAMPLE = 'SET_VEGA_EXAMPLE';
export const SET_VEGA_LITE_EXAMPLE = 'SET_VEGA_LITE_EXAMPLE';
export const SET_GIST_VEGA_SPEC = 'SET_GIST_VEGA_SPEC';
export const SET_GIST_VEGA_LITE_SPEC = 'SET_GIST_VEGA_LITE_SPEC';
export const TOGGLE_AUTO_PARSE = 'TOGGLE_AUTO_PARSE';
export const CYCLE_RENDERER = 'CYCLE_RENDERER';
export const SHOW_COMPILED_VEGA_SPEC = 'SHOW_COMPILED_VEGA_SPEC'
export const SET_MODE = 'SET_MODE'
import { hashHistory } from 'react-router';

export function setMode (mode) {
  return {
    type: SET_MODE,
    mode: mode
  }
}

export function parseSpec (value) {
  return {
    type: PARSE_SPEC,
    parse: value
  }
};

export function setVegaExample (example, spec) {
  return {
    type: SET_VEGA_EXAMPLE,
    spec: spec,
    example: example
  };
};

export function setVegaLiteExample (example, spec) {
  return {
    type: SET_VEGA_LITE_EXAMPLE,
    spec: spec,
    example: example
  };
};

export function updateVegaSpec (spec) {
  return {
    type: UPDATE_VEGA_SPEC,
    spec: spec
  };
};

export function updateVegaLiteSpec (spec) {
  return {
    type: UPDATE_VEGA_LITE_SPEC,
    spec: spec
  };
};

const getSpecFromGistURL = (gistUrl, mode, cb) => {
  let prefix = 'https://hook.io/tianyiii/vegaeditor/';
  let hookUrl = prefix + mode + '/'
    + gistUrl.substring(gistUrl.indexOf('.com/') + '.com/'.length);
  let suffix = hookUrl.substring(prefix.length);

  return fetch(hookUrl, {
    method: 'get',
    mode: 'cors'
  })
  .then((response) => {
    if (response.status === 200) {
      return Promise.resolve(response);
    } else {
      return Promise.reject(new Error(response.statusText));
    }
  })
  .then((response) => {
    let arrayNames = suffix.split('/');
    if (arrayNames.length < 3) {
      console.warn('invalid url');
      return;
    }
    let username = arrayNames[1];
    let id = arrayNames[2];
    hashHistory.push('/gist/' + mode +'/' + username + '/' + id);
    return response.text();
  })
}

export function setGistVegaLite(url) {
  return dispatch => {
    getSpecFromGistURL(url, 'vega-lite')
      .then((data) => {
        if (data['message'] !== 'Not Found') {
          dispatch({
            type: SET_GIST_VEGA_LITE_SPEC,
            gist: url,
            spec: data
          });
        }
      });
  }
}

export function setGistVega (url) {
  return dispatch => {
    getSpecFromGistURL(url, 'vega')
      .then((data) => {
        if (data['message'] !== 'Not Found') {
          dispatch({
            type: SET_GIST_VEGA_SPEC,
            gist: url,
            spec: data
          });
        }
      });
  };
};


export function toggleAutoParse () {
  return {
    type: TOGGLE_AUTO_PARSE
  };
};

export function cycleRenderer () {
  return {
    type: CYCLE_RENDERER
  };
};

export function showCompiledVegaSpec () {
  return {
    type: SHOW_COMPILED_VEGA_SPEC
  };
};
