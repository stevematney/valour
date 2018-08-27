Valour.js
===

[![Greenkeeper badge](https://badges.greenkeeper.io/stevematney/valour.svg)](https://greenkeeper.io/)

## Simple javascript validation for any app.

![Travis CI Build](https://travis-ci.org/stevematney/valour.svg?branch=master)

Usage
--

### Self-managed
```javascript
var valour = require('valour');
var result;

valour.register('formName', {
  'email': valour.rule.isRequired()
                     .isEmail()
                     .isValidatedBy(function (value) {
                       var disallowedNames = ['joe@notallowed.com', 'steve@isnotavailable.com', 'donotallow@anything.com'];
                       return disallowedNames.indexOf(value) === -1;
                     }, 'This email is not allowed')
                     .isValidatedBy(function (value, allValues) {
                       return allValues.spouseEmail.indexOf(value) === -1;
                     }, 'The {name} field must be different from the spouse email.')
 }, function (res) {
  result = res;
 });

valour.update('formName', {
  'confirmEmail': valour.rule.equalsOther('email')
})

valour.runValidation('formName', { email: 'myemail@emailtown.com' });
// result === { 'email': {valid: true} }
valour.forceValidation('formName', {});
// result === {'email': {valid: false, messages: ['email is required.']}}
valour.runValidation('formName', { email: 'notanemail' });
// result === { 'email': {valid: false, messages: ['email must be a valid email address']} }
valour.runValidation('formName', { email: 'joe@notallowed.com' });
// result === { 'email': {valid: false, messages: ['This email is not allowed']} }
valour.runValidation('formName', { email: 'joe@isallowed.com', spouseEmail: 'joe@istallowed.com' });
// result === { 'email': {valid: false, messages: ['The email field must be different from the spouse email.']} }
valour.runValidation('formName', { email: 'joe@isallowed.com', confirmEmail: 'joe@isnotallowed.com' });
// result === { 'confirmEmail': {valid: false, messages: ['The confirmEmail field must be equal to email.']} }
valour.runValidation('formName', { email: 'myemail@emailtown.com' });
// result === { 'email': {valid: true} }
```

#### NOTE:
An important distinction here is the difference between `runValidation` and `forceValidation`. `runValidation` is something you would use as things update (like in a `change` event for an input), and `forceValidation` is what you would use when you wanted to check all fields (like in a `submit` event). `runValidation` does not check `undefined` values, but `forceValidation` will. This is because, most of the time, you don't want your UI to falsely report to the user when they haven't yet put any data into a required field.

### Async validation

```javascript
var valour = require('valour');
var resolve, reject, result;

function resolveResult() {
  resolve();
}

function rejectResult() {
  resolve();
}

valour.register('formName', {
  'email': valour.rule.isEventuallyValidatedBy(
    function (value, allValues, res, rej) {
      resolve = res;
      reject = rej;
    });
  }, function (res) {
    result = res;
  });

valour.runValidation('formName', { email: 'myemail@emailtown.com' });
// result === { 'email': { waiting: true }}

resolveResult();
// result === { 'email': { valid: true }}

valour.runValidation('formName', { email: 'myemail@emailtown.com' });
// result === { 'email': { waiting: true }}

rejectResult();
valour.runValidation('formName', { email: 'myemail@emailtown.com' });
// result === { 'email': { valid: false }}
```
### Setting the validation state
There may be times when you want to tell valour about the validity of your form.  This may be on initial page load, or after some server-side validation has occurred.  Whatever the case may be, 'setValidationState' is what you'll need to call.  This little utility function takes 
in a form name and an object, then updates the form with the information the object holds.  Afterwards, it will run any callbacks you have given it to alert them of the new state.

```javascript
var valour = require('valour');
var result;

valour.register('formName', {
  'email': valour.rule.isEmail()
 }, function (res) {
  result = res;
 });

valour.setValidationState('formName', { email: { valid: false } });
// result === { 'email': { valid: false } }

valour.setValidationState('formName', { email: { valid: false, messages: ['New error.'] } });
// result === { 'email': { valid: false, messages: ['New error.'] } }

valour.setValidationState('formName', { email: { valid: true, messages: ['All clear'] } });
// result === { 'email': { valid: true, messages: ['All clear'] } }
```

Another way to do this is to initialize the state when registering.  The callback provided will be called immediately, in this case.

```javascript
var valour = require('valour');
var result;

valour.register('formName', {
  'email': valour.rule.isEmail().initializeState({ valid: false })
 }, function (res) {
  result = res;
 });
// result === { 'email': { valid: false } }

valour.register('anotherForm', {
  'email': valour.rule.isEmail().initializeState({ valid: true, messages: ['Some message'] })
 }, function (res) {
  result = res;
 });
// result === { 'email': { valid: true, messages: ['Some message'] } }

```