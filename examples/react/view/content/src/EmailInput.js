import React from 'react';
import ValidatedInput from './ValidatedInput';
import inputProps from './input-props';
import valour from 'valour';
import PropTypes from 'prop-types';

export default class EmailInput extends React.Component {
  static propTypes = {
    ...inputProps,
    focusWasGained: PropTypes.func
  }
  constructor() {
    super();
    this.state = {};
  }

  getSanitizedValue(val) {
    return val.trim();
  }

  getValidation() {
    return valour.rule.isEmail();
  }

  render() {
    const {getValidation, getSanitizedValue} = this;
    let props = {...this.props, getValidation, getSanitizedValue};
    return <ValidatedInput { ...props } onFocus={this.props.focusWasGained} />;
  }
}
