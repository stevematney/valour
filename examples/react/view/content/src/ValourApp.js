import 'expose?$!expose?jQuery!jquery';
import 'bootstrap-webpack';
import React from 'react';
import ValidatedForm from './ValidatedForm';
import ValidatedInput from './ValidatedInput';
import RequiredInput from './RequiredInput';

export default function render() {
  let formName = 'CreateAccount';
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
          <RequiredInput formName={formName} labelValue='First Name' name='FirstName'/>
          <RequiredInput formName={formName} labelValue='Last Name' name='LastName'/>
          <ValidatedInput formName={formName} labelValue='Social Security Number' name='Ssn'/>
          <ValidatedInput formName={formName} labelValue='Email' name='Email'/>
          <ValidatedInput formName={formName} labelValue='Confirm Email' name='ConfirmEmail'/>
          <ValidatedInput formName={formName} labelValue='Password' name='Password'/>
          <ValidatedInput formName={formName} labelValue='Confirm Password' name='ConfirmPassword'/>
        </ValidatedForm>
      </div>
    </div>
  );
}
