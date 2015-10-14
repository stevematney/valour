Validation
===
## Simple javascript validation for any app.

Usage
--

### Self-managed
```javascript
var validation = require('validation');
var result;

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
                     }, 'The {name} field cannot be in your other addresses.')
 }, function (res) {
  result = res;
 });

validation.runValidation('formName', { email: 'myemail@emailtown.com' });
// result === { 'email': {valid: true} }

validation.forceValidation('formName', {});
// result === {'email': {valid: false, messages: ['email is required.']}}
validation.runValidation('formName', { email: 'notanemail' });
// result === { 'email': {valid: false, messages: ['email must be a valid email address']} }
validation.runValidation('formName', { email: 'joe@notallowed.com' });
// result === { 'email': {valid: false, messages: ['This email is not allowed']} }
validation.runValidation('formName', { email: 'joe@isallowed.com', confirmEmail: 'joe@notallowed.com' });
// result === { 'email': {valid: false, messages: ['The email field cannot be in your other addresses.']} }
```

#### NOTE:
An important distinction here is the difference between `runValidation` and `forceValidation`. `runValidation` is something you would use as things update (like in a `change` event for an input), and `forceValidation` is what you would use when you wanted to check all fields (like in a `submit` event). `runValidation` does not check `undefined` values, but `forceValidation` will. This is because, most of the time, you don't want your UI to falsely report to the user when they haven't yet put any data into a required field.

### Async validation

```javascript
var validation = require('validation');
var resolve, reject, result;

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
  }, function (res) {
    result = res;
  });

validation.runValidation('formName', { email: 'myemail@emailtown.com' });
// result === { 'email': { waiting: true }}

resolveResult();
// result === { 'email': { valid: true }}

validationResult = validation.runValidation('formName', { email: 'myemail@emailtown.com' });
// result === { 'email': { waiting: true }}

rejectResult();
validationResult = validation.getResult('formName');
// result === { 'email': { valid: false }}
```
