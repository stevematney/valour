import React from 'react';
import ReactDOM from 'react-dom';
import ValidatedInput from './ValidatedInput';
import inputProps from './input-props';
import valour from 'valour';
import Popover from 'react-bootstrap/lib/Popover';
import Overlay from 'react-bootstrap/lib/Overlay';

export default class EmailInput extends React.Component {
  static propTypes = inputProps;
  constructor() {
    super();
    this.state = {};
    this.getHelpText = this.getHelpText.bind(this);
    this.getValidation = this.getValidation.bind(this);
  }

  getValidationInfo(val) {
    return {
      capital: /[A-Z]/.test(val),
      lowercase: /[a-z]/.test(val),
      number: /[0-9]/.test(val),
      length: val && val.length >= 8
    };
  }

  getSanitizedValue(val) {
    return val.trim();
  }

  getValidation() {
    return valour.rule.isValidatedBy((val) => {
      var result = this.getValidationInfo(val);
      return Object.keys(result).every((key) => result[key]);
    }, '{name} must contain a capital letter, a lowercase letter, a number, and be at least 8 characters long');
  }

  getCheckOrBox(check) {
    return (check) ? '\u2713' : '\u2610';
  }

  getHelpText(current) {
    var info = this.getValidationInfo(current.currentValue);
    return (
      <Overlay
        show={current.state.valid === false}
        target={() => ReactDOM.findDOMNode(this.refs.input)}
        placement='right'
      >
        <Popover placement='right' id='password-popover'>
          <ul className='list-unstyled'>
            <li>{this.getCheckOrBox(info.capital)} Capital letter</li>
            <li>{this.getCheckOrBox(info.lowercase)} Lowercase letter</li>
            <li>{this.getCheckOrBox(info.number)} Number</li>
            <li>{this.getCheckOrBox(info.length)} At least 8 characters</li>
          </ul>
        </Popover>
      </Overlay>
    );
  }

  render() {
    const {getValidation, getSanitizedValue} = this;
    let props = {...this.props, getValidation, getSanitizedValue};
    return <ValidatedInput { ...props } type='password' ref='input' getValidation={this.getValidation} getHelpText={this.getHelpText} />;
  }
}
