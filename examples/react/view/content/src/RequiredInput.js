import React from 'react';
import ValidatedInput from './ValidatedInput';
import inputProps from './input-props';

export default class RequiredInput extends React.Component {
  static propTypes = inputProps;

  render() {
    return <ValidatedInput {...this.props} required={true} />;
  }
}
