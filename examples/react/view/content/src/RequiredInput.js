import React from 'react';
import ValidatedInput from './ValidatedInput';
import inputProps from './input-props';

export default class RequiredInput extends React.Component {
  static propTypes = inputProps;
  constructor() {
    super();
    this.state = {};
  }

  render() {
    return <ValidatedInput {...this.props} valid={this.state.valid} required={true} />;
  }
}
