Validation
===
Simple validation for any app.
--

Usage
--

## Self-managed
```javascript
var validation = require('validation');

validation.register('formName', {
  'email': validation.isRequired()
                     .isEmail()
                     .isValidatedBy(function (value) {
                       var disallowedNames = ['joe@notallowed.com', 'steve@isnotavailable.com', 'donotallow@anything.com'];
                       return disallowedNames.indexOf(value) === -1;
                     }, 'This email is not allowed')
});

var validationResult = validation.isValid('formName', { email: 'myemail@emailtown.com' }); 
// validationResult === { 'email': {valid: true} }
var notIncludedResult = validation.isValid('formName', {});
// notIncludedResult === {'email': {valid: false, messages: ['Email is required.']}}
var nonEmailResult = validation.isValid('formName', { email: 'notanemail' });
// nonEmailResult === { 'email': {valid: false, messages: ['This is not a valid email address']} }
var notAllowedResult = validation.isValid('formName', { email: 'joe@notallowed.com' });
// notAllowedResult === { 'email': {valid: false, messages: ['This email is not allowed']} }
```

## Form-listening

This will register the appropriate listeners with your form inputs. Ensure that a form with the given name exists and that the 

```javascript
var validation = require('validation');

validation.registerForm('formName', { // This will throw if no form with this name attribute is found on the DOM
  'email': validation.isRequired()
                     .isEmail()
                     .isValidatedBy(function (value) {
                       var disallowedNames = ['joe@notallowed.com', 'steve@isnotavailable.com', 'donotallow@anything.com'];
                       return disallowedNames.indexOf(value) === -1;
                     }, 'This email is not allowed')
});

validation.onValidationResult('formName', function (result) {
  //handle validation result
});
```
## Async validation

```javascript
var validation = require('validation');
var resolve;

function resolveResult = function () {
  resolve(true);
}

validation.register('formName', {
  'email': validation.isEventuallyValidatedBy(
    function (resolve) {
      resolve = resolve;
      //do async check, then resolve(result);
    });
});

var validationResult = validation.isValid('formName', { email: 'myemail@emailtown.com' });
// validationResult === { 'email': { awaitingValidation: true }}

resolveResult();
validationResult = validation.isValid('formName', { email: 'myemail@emailtown.com' });
// validationResult === { 'email': { valid: true }}
```
