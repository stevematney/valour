'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _validator = require('validator');

var _validator2 = _interopRequireDefault(_validator);

var _utilFunctionsEqual = require('./util/functions-equal');

var _utilFunctionsEqual2 = _interopRequireDefault(_utilFunctionsEqual);

var _utilFormatValidationMessage = require('./util/format-validation-message');

var _utilFormatValidationMessage2 = _interopRequireDefault(_utilFormatValidationMessage);

var _lodashLangIsUndefined = require('lodash/lang/isUndefined');

var _lodashLangIsUndefined2 = _interopRequireDefault(_lodashLangIsUndefined);

var _lodashLangIsNull = require('lodash/lang/isNull');

var _lodashLangIsNull2 = _interopRequireDefault(_lodashLangIsNull);

function getDates(beforeIn, afterIn) {
  var before = new Date(beforeIn.toString());
  var after = new Date(afterIn.toString());
  return { before: before, after: after };
}

var defaultCurrencyOptions = {
  symbol: '$',
  require_symbol: false,
  allow_space_after_symbol: false,
  symbol_after_digits: false,
  allow_negatives: true,
  parens_for_negatives: false,
  negative_sign_before_digits: false,
  negative_sign_after_digits: false,
  allow_negative_sign_placeholder: false,
  thousands_separator: ',',
  decimal_separator: '.',
  allow_space_after_digits: false,
  include_extra_info: true
};

var defaultFqdnOptions = {
  require_tld: true,
  allow_underscores: false,
  allow_trailing_dot: false
};

var requiredFunc = function requiredFunc(val) {
  return !!val;
};

var isCheckable = function isCheckable(val) {
  return !(0, _lodashLangIsUndefined2['default'])(val) && !(0, _lodashLangIsNull2['default'])(val) && val.toString().length;
};

var ValidationUnit = (function () {
  function ValidationUnit() {
    _classCallCheck(this, ValidationUnit);

    for (var _len = arguments.length, existing = Array(_len), _key = 0; _key < _len; _key++) {
      existing[_key] = arguments[_key];
    }

    this.rules = existing.map(function (ex) {
      return ex.rules;
    }).reduce(function (list, existingRuleList) {
      return [].concat(_toConsumableArray(list), _toConsumableArray(existingRuleList));
    }, []).reduce(function (finalRules, rule) {
      var hasEquivalent = finalRules.some(function (existingRule) {
        return (0, _utilFunctionsEqual2['default'])(existingRule.func, rule.func);
      });
      if (!rule.forced && hasEquivalent) {
        return finalRules;
      }
      return [].concat(_toConsumableArray(finalRules), [rule]);
    }, []);
  }

  _createClass(ValidationUnit, [{
    key: 'hasIsRequired',
    value: function hasIsRequired() {
      return this.rules.some(function (x) {
        return (0, _utilFunctionsEqual2['default'])(x.func, requiredFunc);
      });
    }
  }, {
    key: 'createCustomPromiseGenerator',
    value: function createCustomPromiseGenerator(func) {
      var _this = this;

      return function (val, allValues, messageList, name) {
        return new Promise(function (resolve, reject) {
          return !_this.hasIsRequired() && !isCheckable(val) || func(val, allValues, messageList, name, resolve, reject);
        });
      };
    }
  }, {
    key: 'createPromiseGenerator',
    value: function createPromiseGenerator(func, message) {
      return this.createCustomPromiseGenerator(function (val, allValues, messageList, name, resolve, reject) {
        if (func(val, allValues)) {
          return resolve();
        }
        messageList.push((0, _utilFormatValidationMessage2['default'])(message, { name: name }));
        return reject();
      });
    }
  }, {
    key: 'runValidation',
    value: function runValidation(value, allValues, name) {
      var _this2 = this;

      this.valid = undefined;
      this.messages = [];
      var generators = this.rules.map(function (rule) {
        return rule.generator;
      });
      return Promise.all(generators.map(function (gen) {
        return gen(value, allValues, _this2.messages, name);
      })).then(function () {
        return _this2.valid = true;
      }, function () {
        return _this2.valid = false;
      });
    }
  }, {
    key: 'getState',
    value: function getState() {
      var valid = this.valid;
      var messages = this.messages;

      return {
        waiting: valid === undefined,
        valid: valid,
        messages: messages
      };
    }
  }, {
    key: 'forceRequirement',
    value: function forceRequirement(func, failureMessage) {
      var generator = arguments.length <= 2 || arguments[2] === undefined ? this.createPromiseGenerator(func, failureMessage) : arguments[2];
      var forced = arguments.length <= 3 || arguments[3] === undefined ? true : arguments[3];
      return (function () {
        this.rules = [].concat(_toConsumableArray(this.rules), [{ func: func, forced: forced, generator: generator }]);
        return new ValidationUnit(this);
      }).apply(this, arguments);
    }
  }, {
    key: 'setRequirement',
    value: function setRequirement(func, failureMessage) {
      var matchingFuncs = this.rules.filter(function (rule) {
        return !rule.forced;
      }).map(function (rule) {
        return rule.func;
      }).filter(function (testFunc) {
        return (0, _utilFunctionsEqual2['default'])(testFunc, func);
      });
      if (matchingFuncs.length) {
        return this;
      }
      return this.forceRequirement(func, failureMessage, undefined, false);
    }
  }, {
    key: 'setValidatorRequirement',
    value: function setValidatorRequirement(funcName, message) {
      for (var _len2 = arguments.length, extraValues = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
        extraValues[_key2 - 2] = arguments[_key2];
      }

      return this.setRequirement(function (val) {
        return _validator2['default'][funcName].apply(_validator2['default'], [val].concat(extraValues));
      }, message);
    }
  }, {
    key: 'isValidatedBy',
    value: function isValidatedBy(func, message) {
      return this.forceRequirement(function (val, allValues) {
        return func(val, allValues);
      }, message);
    }
  }, {
    key: 'isEventuallyValidatedBy',
    value: function isEventuallyValidatedBy(func, message) {
      var generator = this.createCustomPromiseGenerator(function (val, allValues, messageList, name, resolve, reject) {
        return func(val, allValues, resolve, function () {
          messageList.push((0, _utilFormatValidationMessage2['default'])(message, { name: name }));
          reject();
        });
      });
      return this.forceRequirement(func, message, generator);
    }
  }, {
    key: 'isRequired',
    value: function isRequired() {
      var message = arguments.length <= 0 || arguments[0] === undefined ? '{name} is required.' : arguments[0];

      return this.setRequirement(requiredFunc, '{name} is required.', message);
    }
  }, {
    key: 'isEmail',
    value: function isEmail() {
      var message = arguments.length <= 0 || arguments[0] === undefined ? '{name} must be a valid email address.' : arguments[0];

      return this.setValidatorRequirement('isEmail', message);
    }
  }, {
    key: 'contains',
    value: function contains(needle) {
      var message = arguments.length <= 1 || arguments[1] === undefined ? '{name} must contain "{needle}."' : arguments[1];

      return this.setValidatorRequirement('contains', (0, _utilFormatValidationMessage2['default'])(message, { needle: needle }), needle);
    }
  }, {
    key: 'equals',
    value: function equals(comparison) {
      var message = arguments.length <= 1 || arguments[1] === undefined ? '{name} must equal "{comparison}."' : arguments[1];

      return this.setValidatorRequirement('equals', (0, _utilFormatValidationMessage2['default'])(message, { comparison: comparison }), comparison);
    }
  }, {
    key: 'equalsOther',
    value: function equalsOther(other) {
      var message = arguments.length <= 1 || arguments[1] === undefined ? '{name} must be equal to {other}.' : arguments[1];

      return this.setRequirement(function (val, others) {
        return _validator2['default'].equals(val, others[other]);
      }, (0, _utilFormatValidationMessage2['default'])(message, { other: other }));
    }
  }, {
    key: 'isAfter',
    value: function isAfter(date) {
      var message = arguments.length <= 1 || arguments[1] === undefined ? '{name} must be after {date}.' : arguments[1];

      return this.setRequirement(function (val) {
        var dates = getDates(date, val);
        return _validator2['default'].isAfter(dates.after, dates.before);
      }, (0, _utilFormatValidationMessage2['default'])(message, { date: date }));
    }
  }, {
    key: 'isBefore',
    value: function isBefore(date) {
      var message = arguments.length <= 1 || arguments[1] === undefined ? '{name} must be before {date}.' : arguments[1];

      return this.setRequirement(function (val) {
        var dates = getDates(val, date);
        return _validator2['default'].isBefore(dates.before, dates.after);
      }, (0, _utilFormatValidationMessage2['default'])(message, { date: date }));
    }
  }, {
    key: 'isAlpha',
    value: function isAlpha() {
      var message = arguments.length <= 0 || arguments[0] === undefined ? '{name} must use only alphabetical characters.' : arguments[0];

      return this.setValidatorRequirement('isAlpha', message);
    }
  }, {
    key: 'isAlphanumeric',
    value: function isAlphanumeric() {
      var message = arguments.length <= 0 || arguments[0] === undefined ? '{name} must use only alphanumeric characters.' : arguments[0];

      return this.setValidatorRequirement('isAlphanumeric', message);
    }
  }, {
    key: 'isAscii',
    value: function isAscii() {
      var message = arguments.length <= 0 || arguments[0] === undefined ? '{name} must use only ASCII characters.' : arguments[0];

      return this.setValidatorRequirement('isAscii', message);
    }
  }, {
    key: 'isBase64',
    value: function isBase64() {
      var message = arguments.length <= 0 || arguments[0] === undefined ? '{name} must be base64 encoded.' : arguments[0];

      return this.setValidatorRequirement('isBase64', message);
    }
  }, {
    key: 'isBoolean',
    value: function isBoolean() {
      var message = arguments.length <= 0 || arguments[0] === undefined ? '{name} must be a boolean value.' : arguments[0];

      return this.setValidatorRequirement('isBoolean', message);
    }
  }, {
    key: 'isByteLength',
    value: function isByteLength(min, max) {
      var message = arguments.length <= 2 || arguments[2] === undefined ? '{name} must have a minimum byte length of {min}.' : arguments[2];

      return this.setValidatorRequirement('isByteLength', (0, _utilFormatValidationMessage2['default'])(message, { min: min, max: max }), min, max);
    }
  }, {
    key: 'isCreditCard',
    value: function isCreditCard() {
      var message = arguments.length <= 0 || arguments[0] === undefined ? '{name} must be a credit card number.' : arguments[0];

      return this.setValidatorRequirement('isCreditCard', message);
    }
  }, {
    key: 'isCurrency',
    value: function isCurrency() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? defaultCurrencyOptions : arguments[0];
      var message = arguments.length <= 1 || arguments[1] === undefined ? '{name} must be in the format "{format}". {extraInfo}' : arguments[1];
      var extraInfoMessage = arguments.length <= 2 || arguments[2] === undefined ? '(Currency symbol ({symbol}) {notOrIs} required.)' : arguments[2];

      var computedOptions = _extends({}, defaultCurrencyOptions, options);
      var symbol = computedOptions.require_symbol ? computedOptions.symbol : '';
      var symbolStart = computedOptions.symbol_after_digits ? '' : symbol;
      var symbolEnd = computedOptions.symbol_after_digits ? symbol : '';
      var notOrIs = computedOptions.require_symbol ? 'is' : 'not';
      var formattedExtra = (0, _utilFormatValidationMessage2['default'])(extraInfoMessage, _extends({}, computedOptions, { notOrIs: notOrIs }));
      var extraInfo = computedOptions.include_extra_info ? formattedExtra : '';
      var thousands_separator = computedOptions.thousands_separator;
      var decimal_separator = computedOptions.decimal_separator;

      var format = symbolStart + '1' + thousands_separator + '000' + decimal_separator + '00' + symbolEnd;
      var messageWithFormat = (0, _utilFormatValidationMessage2['default'])(message, _extends({ format: format, extraInfo: extraInfo }, computedOptions)).trim();
      return this.setValidatorRequirement('isCurrency', messageWithFormat, computedOptions);
    }
  }, {
    key: 'isDate',
    value: function isDate() {
      var message = arguments.length <= 0 || arguments[0] === undefined ? '{name} must be a date.' : arguments[0];

      return this.setValidatorRequirement('isDate', message);
    }
  }, {
    key: 'isDecimal',
    value: function isDecimal() {
      var message = arguments.length <= 0 || arguments[0] === undefined ? '{name} must represent a decimal number.' : arguments[0];

      return this.setValidatorRequirement('isDecimal', message);
    }
  }, {
    key: 'isDivisibleBy',
    value: function isDivisibleBy(number) {
      var message = arguments.length <= 1 || arguments[1] === undefined ? '{name} must be divisible by {number}.' : arguments[1];

      return this.setValidatorRequirement('isDivisibleBy', (0, _utilFormatValidationMessage2['default'])(message, { number: number }), number);
    }
  }, {
    key: 'isFQDN',
    value: function isFQDN() {
      var options = arguments.length <= 0 || arguments[0] === undefined ? defaultFqdnOptions : arguments[0];
      var message = arguments.length <= 1 || arguments[1] === undefined ? '{name} must be a fully qualified domain name.' : arguments[1];

      return this.setValidatorRequirement('isFQDN', message, options);
    }
  }, {
    key: 'isFloat',
    value: function isFloat(options) {
      var message = arguments.length <= 1 || arguments[1] === undefined ? '{name} must be a float.' : arguments[1];

      return this.setValidatorRequirement('isFloat', message, options);
    }
  }, {
    key: 'isFullWidth',
    value: function isFullWidth() {
      var message = arguments.length <= 0 || arguments[0] === undefined ? '{name} must contain fullwidth characters.' : arguments[0];

      return this.setValidatorRequirement('isFullWidth', message);
    }
  }, {
    key: 'isHalfWidth',
    value: function isHalfWidth() {
      var message = arguments.length <= 0 || arguments[0] === undefined ? '{name} must contain halfwidth characters.' : arguments[0];

      return this.setValidatorRequirement('isHalfWidth', message);
    }
  }, {
    key: 'isVariableWidth',
    value: function isVariableWidth() {
      var message = arguments.length <= 0 || arguments[0] === undefined ? '{name} must contain fullwidth and halfwidth characters.' : arguments[0];

      return this.setValidatorRequirement('isVariableWidth', message);
    }
  }, {
    key: 'isHexColor',
    value: function isHexColor() {
      var message = arguments.length <= 0 || arguments[0] === undefined ? '{name} must be a hex color.' : arguments[0];

      return this.setValidatorRequirement('isHexColor', message);
    }
  }, {
    key: 'isHexadecimal',
    value: function isHexadecimal() {
      var message = arguments.length <= 0 || arguments[0] === undefined ? '{name} must be a hexadecimal number.' : arguments[0];

      return this.setValidatorRequirement('isHexadecimal', message);
    }
  }, {
    key: 'isIP',
    value: function isIP(version) {
      var message = arguments.length <= 1 || arguments[1] === undefined ? '{name} must be an IP address.' : arguments[1];

      return this.setValidatorRequirement('isIP', message, version);
    }
  }, {
    key: 'isISBN',
    value: function isISBN(version) {
      var message = arguments.length <= 1 || arguments[1] === undefined ? '{name} must be an ISBN.' : arguments[1];

      return this.setValidatorRequirement('isISBN', message, version);
    }
  }, {
    key: 'isISIN',
    value: function isISIN() {
      var message = arguments.length <= 0 || arguments[0] === undefined ? '{name} must be an ISIN.' : arguments[0];

      return this.setValidatorRequirement('isISIN', message);
    }
  }, {
    key: 'isISO8601',
    value: function isISO8601() {
      var message = arguments.length <= 0 || arguments[0] === undefined ? '{name} must be an ISO6801 date.' : arguments[0];

      return this.setValidatorRequirement('isISO8601', message);
    }
  }, {
    key: 'isIn',
    value: function isIn(values) {
      var message = arguments.length <= 1 || arguments[1] === undefined ? '{name} must be contained in {values}.' : arguments[1];

      var formattedMessage = (0, _utilFormatValidationMessage2['default'])(message, { values: JSON.stringify(values) });
      return this.setValidatorRequirement('isIn', formattedMessage, values);
    }
  }, {
    key: 'isInt',
    value: function isInt(options) {
      var message = arguments.length <= 1 || arguments[1] === undefined ? '{name} must be an integer.' : arguments[1];

      return this.setValidatorRequirement('isInt', message, options);
    }
  }, {
    key: 'isJSON',
    value: function isJSON() {
      var message = arguments.length <= 0 || arguments[0] === undefined ? '{name} must be JSON.' : arguments[0];

      return this.setValidatorRequirement('isJSON', message);
    }
  }, {
    key: 'isLength',
    value: function isLength(min, max) {
      var message = arguments.length <= 2 || arguments[2] === undefined ? '{name} must be at least {min} characters.' : arguments[2];

      var formattedMessage = (0, _utilFormatValidationMessage2['default'])(message, { min: min, max: max });
      return this.setValidatorRequirement('isLength', formattedMessage, min, max);
    }
  }, {
    key: 'isLowercase',
    value: function isLowercase() {
      var message = arguments.length <= 0 || arguments[0] === undefined ? '{name} must be lowercase.' : arguments[0];

      return this.setValidatorRequirement('isLowercase', message);
    }
  }, {
    key: 'isUppercase',
    value: function isUppercase() {
      var message = arguments.length <= 0 || arguments[0] === undefined ? '{name} must be uppercase.' : arguments[0];

      return this.setValidatorRequirement('isUppercase', message);
    }
  }, {
    key: 'isMobilePhone',
    value: function isMobilePhone() {
      var locale = arguments.length <= 0 || arguments[0] === undefined ? 'en-US' : arguments[0];
      var message = arguments.length <= 1 || arguments[1] === undefined ? '{name} must be a phone number.' : arguments[1];

      return this.setValidatorRequirement('isMobilePhone', message, locale);
    }
  }, {
    key: 'isMongoId',
    value: function isMongoId() {
      var message = arguments.length <= 0 || arguments[0] === undefined ? '{name} must be a MongoDB id.' : arguments[0];

      return this.setValidatorRequirement('isMongoId', message);
    }
  }, {
    key: 'isMultibyte',
    value: function isMultibyte() {
      var message = arguments.length <= 0 || arguments[0] === undefined ? '{name} must contain multibyte characters.' : arguments[0];

      return this.setValidatorRequirement('isMultibyte', message);
    }
  }, {
    key: 'isNumeric',
    value: function isNumeric() {
      var message = arguments.length <= 0 || arguments[0] === undefined ? '{name} must be numeric.' : arguments[0];

      return this.setValidatorRequirement('isNumeric', message);
    }
  }, {
    key: 'isSurrogatePair',
    value: function isSurrogatePair() {
      var message = arguments.length <= 0 || arguments[0] === undefined ? '{name} must be a surrogate pair.' : arguments[0];

      return this.setValidatorRequirement('isSurrogatePair', message);
    }
  }, {
    key: 'isURL',
    value: function isURL(options) {
      var message = arguments.length <= 1 || arguments[1] === undefined ? '{name} must be a url.' : arguments[1];

      return this.setValidatorRequirement('isURL', message, options);
    }
  }, {
    key: 'isUUID',
    value: function isUUID(version) {
      var message = arguments.length <= 1 || arguments[1] === undefined ? '{name} must be a UUID.' : arguments[1];

      return this.setValidatorRequirement('isUUID', message, version);
    }
  }, {
    key: 'matches',
    value: function matches(pattern, modifiers) {
      var message = arguments.length <= 2 || arguments[2] === undefined ? '{name} must match {pattern}.' : arguments[2];

      var formattedMessage = (0, _utilFormatValidationMessage2['default'])(message, { pattern: pattern });
      return this.setValidatorRequirement('matches', formattedMessage, pattern, modifiers);
    }
  }]);

  return ValidationUnit;
})();

exports['default'] = ValidationUnit;
module.exports = exports['default'];