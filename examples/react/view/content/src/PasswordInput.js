import React from 'react';
import ValidatedInput from './ValidatedInput';
import inputProps from './input-props';
import valour from 'valour';

export default class EmailInput extends React.Component {
  static propTypes = inputProps;
  constructor() {
    super();
    this.state = {};
  }

  getSanitizedValue(val) {
    return val.trim();
  }

  getValidation() {
    return valour.rule.isValidatedBy((val) => {
      return /[A-Z]/.test(val) &&
        /[a-z]/.test(val) &&
        /[0-9]/.test(val) &&
        val.length >= 8;
    }, '{name} must contain a capital letter, a lowercase letter, a number, and be at least 8 characters long');
  }

  render() {
    const {getValidation, getSanitizedValue} = this;
    let props = {...this.props, getValidation, getSanitizedValue};
    return <ValidatedInput { ...props } type='password' getValidation={this.getValidation} />;
  }
}
