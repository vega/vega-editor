import { connect } from 'react-redux';
import Renderer from './renderer';

function mapStateToProps (state, ownProps) {
  return {
    error: state.app.error,
    warningsLogger: state.app.warningsLogger,
    errorPane: state.app.errorPane
  };
}

export default connect(mapStateToProps)(Renderer);
