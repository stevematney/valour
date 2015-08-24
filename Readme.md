Validation
===
Simple validation for any app.
--

Usage
--

*Using modules*
```
validation.render('formName', {
  'email': validation.isRequired()
                     .isEmail()
                     .isValidatedBy(function (value) {
                       return ['joe@notallowed.com', 'steve@isnotavailable.com', 'donotallow@anything.com'].indexOf(value) === -1;
                     }, 'This email is not allowed')
})

var validationResult = validation.isValid('formName', { email: 'myemail@emailtown.com' }); //{ 'email': {valid: true} }
var notIncludedResult = validation.isValid('formName', {}); // {'email': {valid: false, message: 'Email is required.'}}
var nonEmailResult = validation.isValid('formName', { email: 'notanemail' }); //{ 'email': {valid: false, message: 'This is not a valid email address'} }
var notAllowedResult = validation.isValid('formName', { email: 'joe@notallowed.com' }); //{ 'email': {valid: false, message: 'This email is not allowed'} }
```
