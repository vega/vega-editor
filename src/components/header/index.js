import { connect } from 'react-redux';
import Renderer from './renderer';
import * as EditorActions from '../../actions/editor';

const mapStateToProps = function (state, ownProps) {
  return {
    editorString: state.app.editorString,
    mode: state.app.mode
  };
};

const mapDispatchToProps = function (dispatch) {
  return {
    setGistVega: (url) => {
      dispatch(EditorActions.setGistVega(url));
    },

    setGistVegaLite: (url) => {
      dispatch(EditorActions.setGistVegaLite(url));
    }
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Renderer);
