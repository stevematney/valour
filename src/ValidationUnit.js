import validator from 'validator';
import functionsEqual from './util/functions-equal';
import formatValidationMessage from './util/format-validation-message';

function getDates(beforeIn, afterIn) {
  let before = new Date(beforeIn.toString());
  let after = new Date(afterIn.toString());
  return { before, after };
}

let defaultCurrencyOptions = {
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

export default class ValidationUnit {
  constructor(...existing) {
    this.rules = existing
                   .map(ex => ex.rules)
                   .reduce((list, existingRuleList) => [...list, ...existingRuleList], [])
                   .reduce((finalRules, rule) => {
                     let hasEquivalent = finalRules.some(existingRule => functionsEqual(existingRule.func, rule.func));
                     if (!rule.forced && hasEquivalent){
                       return finalRules;
                     }
                     return [...finalRules, rule];
                   }, []);
  }

  createCustomPromiseGenerator(func) {
    return (val, allValues, messageList, name) => new Promise((resolve, reject) => func(val, allValues, messageList, name, resolve, reject));
  }

  createPromiseGenerator(func, message) {
    return this.createCustomPromiseGenerator((val, allValues, messageList, name, resolve, reject) => {
      if (func(val, allValues)) {
        return resolve();
      }
      messageList.push(formatValidationMessage(message, { name }))
      return reject();
    });
  }

  runValidation(value, allValues, name) {
    this.valid = undefined;
    this.messages = [];
    let generators = this.rules.map((rule) => rule.generator);
    return Promise.all(generators.map((gen) => gen(value, allValues, this.messages, name)))
                  .then(() => this.valid = true,
                        () => this.valid = false);
  }

  getState() {
    let {valid, messages} = this;
    return {
      waiting: valid === undefined,
      valid,
      messages
    };
  }

  forceRequirement(func,
                   failureMessage,
                   generator = this.createPromiseGenerator(func, failureMessage),
                   forced = true) {
    this.rules = [...this.rules, { func, forced, generator }];
    return new ValidationUnit(this);
  }

  setRequirement(func, failureMessage) {
    let matchingFuncs = this.rules.filter((rule) => !rule.forced)
                                  .map((rule) => rule.func)
                                  .filter((testFunc) => functionsEqual(testFunc, func));
    if (matchingFuncs.length) {
      return this;
    }
    return this.forceRequirement(func, failureMessage, undefined, false);
  }

  isValidatedBy(func, message) {
    return this.forceRequirement((val, allValues) => func(val, allValues), message);
  }

  isEventuallyValidatedBy(func, message) {
    let generator = this.createCustomPromiseGenerator((val, allValues, messageList, name, resolve, reject) => func(val, allValues, resolve, () => {
      messageList.push(formatValidationMessage(message, { name }));
      reject();
    }));
    return this.forceRequirement(func, message, generator);
  }

  isRequired(message = '{name} is required.') {
    return this.setRequirement(val => !!val, '{name} is required.')
  }

  isEmail(message = '{name} must be a valid email address.') {
    return this.setRequirement(val => validator.isEmail(val), message);
  }

  contains(needle, message = '{name} must contain "{needle}."') {
    return this.setRequirement(val => validator.contains(val, needle), formatValidationMessage(message, {needle}));
  }

  equals(comparison, message = '{name} must equal "{comparison}."') {
    return this.setRequirement(val => validator.equals(val, comparison), formatValidationMessage(message, {comparison}));
  }

  equalsOther(other, message = '{name} must be equal to {other}.') {
    return this.setRequirement((val, others) => validator.equals(val, others[other]), formatValidationMessage(message, {other}));
  }

  isAfter(date, message = '{name} must be after {date}.') {
    return this.setRequirement((val) => {
      let dates = getDates(date, val);
      return validator.isAfter(dates.after, dates.before);
    }, formatValidationMessage(message, { date }));
  }

  isBefore(date, message = '{name} must be before {date}.') {
    return this.setRequirement((val) => {
      let dates = getDates(val, date);
      return validator.isBefore(dates.before, dates.after);
    }, formatValidationMessage(message, { date }));
  }

  isAlpha(message = '{name} must use only alphabetical characters.') {
    return this.setRequirement(val => validator.isAlpha(val), message);
  }

  isAlphanumeric(message = '{name} must use only alphanumeric characters.') {
    return this.setRequirement(val => validator.isAlphanumeric(val), message);
  }

  isAscii(message = '{name} must use only ASCII characters.') {
    return this.setRequirement(val => validator.isAscii(val), message);
  }

  isBase64(message = '{name} must be base64 encoded.') {
    return this.setRequirement(val => validator.isBase64(val), message);
  }

  isBoolean(message = '{name} must be a boolean value.') {
    return this.setRequirement(val => validator.isBoolean(val), message);
  }

  isByteLength(min, max, message = '{name} must have a minimum byte length of {min}.') {
    return this.setRequirement(val => validator.isByteLength(val, min, max),
                               formatValidationMessage(message, {min, max}));
  }

  isCreditCard(message = '{name} must be a credit card number.') {
    return this.setRequirement(val => validator.isCreditCard(val), message);
  }

  isCurrency(options = defaultCurrencyOptions,
             message = '{name} must be in the format "{format}"{extraInfo}.',
             extraInfoMessage = ' (currency symbol ({symbol}) {notOrIs} required)') {
    let computedOptions = {
      ...defaultCurrencyOptions,
      ...options
    };
    console.log(computedOptions);
    let symbol = computedOptions.require_symbol ? computedOptions.symbol : '';
    let symbolStart = computedOptions.symbol_after_digits ? '' : symbol;
    let symbolEnd = computedOptions.symbol_after_digits ? symbol : '';
    let formattedExtra = formatValidationMessage(extraInfoMessage, {
      ...computedOptions,
      notOrIs: (computedOptions.require_symbol) ? 'is' : 'not'
    });
    let extraInfo = computedOptions.include_extra_info ? formattedExtra : '';
    let {thousands_separator, decimal_separator} = computedOptions;
    let format = `${symbolStart}1${thousands_separator}000${decimal_separator}00${symbolEnd}`;
    let messageWithForm = formatValidationMessage(message, {format, extraInfo, ...computedOptions});
    return this.setRequirement(val => validator.isCurrency(val, computedOptions), messageWithForm);
  }
}


/*
isDate(str)
isDecimal(str)
isDivisibleBy(str, number)
isEmail(str [, options])
isFQDN(str [, options])
isFloat(str [, options])
isFullWidth(str)
isHalfWidth(str)
isHexColor(str)
isHexadecimal(str)
isIP(str [, version])
isISBN(str [, version])
isISIN(str)
isISO8601(str)
isIn(str, values)
isInt(str [, options])
isJSON(str)
isLength(str, min [, max])
isLowercase(str)
isMobilePhone(str, locale)
isMongoId(str)
isMultibyte(str)
isNull(str)
isNumeric(str)
isSurrogatePair(str)
isURL(str [, options])
isUUID(str [, version])
isUppercase(str)
isVariableWidth(str)
matches(str, pattern [, modifiers])
 */
