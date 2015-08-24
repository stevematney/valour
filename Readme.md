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
                     })
})
```
