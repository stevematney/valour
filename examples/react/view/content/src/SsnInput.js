import 'whatwg-fetch';
import React from 'react';
import ValidatedInput from './ValidatedInput';
import inputProps from './input-props';
import valour from 'valour';

export default class SsnInput extends React.Component {
  static propTypes = inputProps;
  constructor() {
    super();
    this.state = {};
    this.ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/;
    this.previousTest = '';
    this.previousResult = false;
    this.testSsn = (val, all, resolve, reject) => {
      if (!this.ssnRegex.test(val)) {
        reject();
        return;
      }
      if (this.previousTest === val && this.previousResult) {
        resolve();
        return;
      }
      this.previousTest = val;
      this.previousResult = false;
      window.fetch('/test-ssn', {
        method: 'post'
      }).then((response) => response.json())
        .then((json) => this.previousResult = json.valid)
        .then((result) => (result) ? resolve() : reject());
    };

    this.getValidation = this.getValidation.bind(this);
  }

  getSanitizedValue(val) {
    return val.trim();
  }

  getValidation() {
    return valour.rule
                 .matches(this.ssnRegex, undefined, '{name} must be a valid Social Security Number (555-55-5555)')
                 .isEventuallyValidatedBy(this.testSsn);
  }

  render() {
    const {getValidation, getSanitizedValue} = this;
    let props = {...this.props, getValidation, getSanitizedValue};
    return <ValidatedInput { ...props } getValidation={this.getValidation} />;
  }
}
