import React from 'react';
import ValidatedInput from './ValidatedInput';
import inputProps from './input-props';
import valour from 'valour';

export default class ConfirmEmailInput extends React.Component {
  static propTypes = {
    ...inputProps,
    matches: React.PropTypes.string.isRequired
  };

  constructor() {
    super();
    this.state = {};
    this.getValidation = this.getValidation.bind(this);
  }

  getSanitizedValue(val) {
    return val.trim();
  }

  getValidation() {
    return valour.rule.isEmail().equalsOther(this.props.matches);
  }

  render() {
    const {getValidation, getSanitizedValue} = this;
    let props = {...this.props, getValidation, getSanitizedValue};
    return <ValidatedInput { ...props } getValidation={this.getValidation} />;
  }
}
