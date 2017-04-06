export const UPDATE_VEGA_SPEC = 'UPDATE_VEGA_SPEC';
export const UPDATE_VEGA_LITE_SPEC = 'UPDATE_VEGA_LITE_SPEC';
export const SET_VEGA_EXAMPLE = 'SET_VEGA_EXAMPLE';
export const SET_VEGA_LITE_EXAMPLE = 'SET_VEGA_LITE_EXAMPLE';
export const SET_GIST_VEGA_SPEC = 'SET_GIST_VEGA_SPEC';
export const SET_GIST_VEGA_LITE_SPEC = 'SET_GIST_VEGA_LITE_SPEC';
export const TOGGLE_DEBUG = 'TOGGLE_DEBUG';
export const CYCLE_RENDERER = 'CYCLE_RENDERER';
export const SHOW_COMPILED_VEGA_SPEC = 'SHOW_COMPILED_VEGA_SPEC'

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

export function setGistVegaSpec (gist, spec) {
  return {
    type: SET_GIST_VEGA_SPEC,
    gist: gist,
    spec: spec
  };
};

export function setGistVegaLiteSpec (gist, spec) {
  return {
    type: SET_GIST_VEGA_LITE_SPEC,
    gist: gist,
    spec: spec
  };
};

export function toggleDebug () {
  return {
    type: TOGGLE_DEBUG
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
