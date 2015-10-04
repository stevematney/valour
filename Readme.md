Validation
===
## Simple javascript validation for any app.

Usage
--

### Self-managed
```javascript
var validation = require('validation');

validation.register('formName', {
  'email': validation.rule.isRequired()
                     .isEmail()
                     .isValidatedBy(function (value) {
                       var disallowedNames = ['joe@notallowed.com', 'steve@isnotavailable.com', 'donotallow@anything.com'];
                       return disallowedNames.indexOf(value) === -1;
                     }, 'This email is not allowed')
                     .equalsOther('confirmEmail')
                     .isValidatedBy(function (value, allValues) {
                       return allValues.otherAddresses.indexOf(value) === -1;
                     }, 'The {name} field cannot be in your other addresses')
});

var validationResult = validation.getResult('formName', { email: 'myemail@emailtown.com' });
// validationResult === { 'email': {valid: true} }
var notIncludedResult = validation.getResult('formName', {});
// notIncludedResult === {'email': {valid: false, messages: ['Email is required.']}}
var nonEmailResult = validation.getResult('formName', { email: 'notanemail' });
// nonEmailResult === { 'email': {valid: false, messages: ['This is not a valid email address']} }
var notAllowedResult = validation.getResult('formName', { email: 'joe@notallowed.com' });
// notAllowedResult === { 'email': {valid: false, messages: ['This email is not allowed']} }
var notAllowedResult = validation.getResult('formName', { email: 'joe@isallowed.com', confirmEmail: 'joe@notallowed.com' });
// notAllowedResult === { 'email': {valid: false, messages: ['The email field must match the email confirmation field']} }
```

### Form-listening

This will register the appropriate listeners with your form inputs. Ensure that a form with the given name exists and that the names of the inputs in the form correspond to the names of the rules you provide to `registerForm`.

```javascript
var validation = require('validation');

validation.registerForm('formName', { // This will throw if no form with this name attribute is found on the DOM
  'email': validation.rule.isRequired()
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
### Async validation

```javascript
var validation = require('validation');
var resolve, reject;

function resolveResult() {
  resolve();
}

function rejectResult() {
  resolve();
}

validation.register('formName', {
  'email': validation.rule.isEventuallyValidatedBy(
    function (value, allValues, resolve, reject) {
      resolve = resolve;
      reject = reject;
    });
});

var validationResult = validation.getResult('formName', { email: 'myemail@emailtown.com' });
// validationResult === { 'email': { waiting: true }}

resolveResult();
validationResult = validation.getResult('formName');
// validationResult === { 'email': { valid: true }}

validationResult = validation.getResult('formName', { email: 'myemail@emailtown.com' });
// validationResult === { 'email': { waiting: true }}

rejectResult();
validationResult = validation.getResult('formName');
// validationResult === { 'email': { valid: false }}
```
