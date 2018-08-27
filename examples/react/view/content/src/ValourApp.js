import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import ValidatedForm from './ValidatedForm';
import RequiredInput from './RequiredInput';
import SsnInput from './SsnInput';
import EmailInput from './EmailInput';
import ConfirmEmailInput from './ConfirmEmailInput';
import PasswordInput from './PasswordInput';
import ConfirmPasswordInput from './ConfirmPasswordInput';
import valour from 'valour';

export default class ValourApp extends React.Component {
  constructor() {
    super();
    this.handleChange = this.handleChange.bind(this);
    this.addValueFunc = this.addValueFunc.bind(this);
    this.focusEmail = this.focusEmail.bind(this);
    this.focusWasGained = this.focusWasGained.bind(this);
    this.formName = 'CreateAccount';
    this.valueFuncs = [];
    this.state = {};
  }

  getValidationValues() {
    return Object.assign({}, ...this.valueFuncs.map(func => func()));
  }

  addValueFunc(newFunc) {
    this.valueFuncs = [...this.valueFuncs, newFunc];
  }

  handleChange() {
    valour.runValidation(this.formName, this.getValidationValues());
  }

  focusEmail() {
    this.setState({
      shouldFocusEmail: true
    });
  }

  focusWasGained() {
    this.setState({
      shouldFocusEmail: false
    });
  }

  render() {
    let {formName} = this;
    return (
      <div>
        <header className='page-header'>
          <div className='container'>
            <h1>
              Create an Account
            </h1>
          </div>
        </header>
      <div className='container'>
          <ValidatedForm name={formName}>
            <RequiredInput
              formName={formName}
              onChange={this.handleChange}
              addValueFunc={this.addValueFunc}
              labelValue='First Name'
              name='FirstName'/>
            <RequiredInput
              formName={formName}
              onChange={this.handleChange}
              addValueFunc={this.addValueFunc}
              labelValue='Last Name'
              name='LastName'/>
            <SsnInput
              formName={formName}
              onChange={this.handleChange}
              addValueFunc={this.addValueFunc}
              required={true}
              labelValue='Social Security Number'
              onFocusLost={this.focusEmail}
              name='Ssn'/>
            <EmailInput
              formName={formName}
              onChange={this.handleChange}
              addValueFunc={this.addValueFunc}
              required={true}
              labelValue='Email'
              shouldFocus={this.state.shouldFocusEmail}
              focusWasGained={this.focusWasGained}
              name='Email'/>
            <ConfirmEmailInput
              formName={formName}
              onChange={this.handleChange}
              addValueFunc={this.addValueFunc}
              labelValue='Confirm Email'
              name='ConfirmEmail'
              required={true}
              matches='Email' />
            <PasswordInput
              formName={formName}
              onChange={this.handleChange}
              addValueFunc={this.addValueFunc}
              labelValue='Password'
              required={true}
              name='Password'/>
            <ConfirmPasswordInput
              formName={formName}
              onChange={this.handleChange}
              addValueFunc={this.addValueFunc}
              labelValue='Confirm Password'
              name='ConfirmPassword'
              required={true}
              matches='Password' />
          </ValidatedForm>
        </div>
      </div>
    );
  }
}
