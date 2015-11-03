import validator from 'validator';
import formatValidationMessage from './util/format-validation-message';
import isUndefined from 'lodash/lang/isUndefined';
import isNull from 'lodash/lang/isNull';

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

let defaultFqdnOptions = {
  require_tld: true,
  allow_underscores: false,
  allow_trailing_dot: false
};

let requiredFunc = val => !!val;

let isCheckable = val => !isUndefined(val) && !isNull(val) && val.toString().length;

export default class ValidationUnit {
  constructor(...existing) {
    this.rules = existing
                   .map(ex => ex.rules)
                   .reduce((list, existingRuleList) => [...list, ...existingRuleList], [])
                   .reduce((finalRules, rule) => {
                     let hasEquivalent = finalRules.some(existingRule => existingRule.name === rule.name);
                     if (!rule.forced && hasEquivalent){
                       return finalRules;
                     }
                     return [...finalRules, rule];
                   }, []);

    this.rules.filter(rule => /^is[A-Z]/.test(rule.name))
              .forEach(rule => {
                var ruleType = rule.name.replace(/^i/, '');
                this[`removeI${ruleType}`] = () => {
                  return this.remove(rule.name);
                };
              });
    this.waiting = 0;
  }

  remove(name) {
    this.rules = this.rules.filter(rule => rule.name !== name);
    return new ValidationUnit(this);
  }

  hasIsRequired() {
    return this.rules.some(x => x.name === 'isRequired');
  }

  createCustomPromiseGenerator(func) {
    return (val, allValues, messageList, name) => new Promise((resolve, reject) =>  func(val, allValues, messageList, name, resolve, reject));
  }

  createPromiseGenerator(func, message) {
    return this.createCustomPromiseGenerator((val, allValues, messageList, name, resolve, reject) => {
      if (func(val, allValues)) {
        return resolve();
      }
      messageList.push(formatValidationMessage(message, { name }));
      return reject();
    });
  }

  runValidation(value, allValues, name) {
    if (this.waiting && this.value === value) {
      return Promise.resolve(true);
    }

    this.value = value;
    this.valid = undefined;
    this.messages = [];
    if (!this.hasIsRequired() && !isCheckable(value)) {
      return Promise.resolve(true).then(() => this.valid = true);
    }

    this.waiting = this.waiting + 1;

    let syncRules = this.rules.filter((rule) => !rule.isAsync);
    let asyncRules = this.rules.filter((rule) => rule.isAsync);
    let getGenerators = (rules) => rules.map((rule) => rule.generator);
    let syncGenerators = getGenerators(syncRules);
    let asyncGenerators = getGenerators(asyncRules);
    let getPromises = (generators) => generators.map((gen) => gen(value, allValues, this.messages, name));
    let removeWaiting = () => this.waiting -= 1;
    let passFunc = () => this.valid = true;
    let failFunc = () => this.valid = false;
    let runSync = () => Promise.all(getPromises(syncGenerators));
    let runAsync = () => Promise.all(getPromises(asyncGenerators));
    return runSync()
             .then(runAsync)
             .then(passFunc)
             .catch(failFunc)
             .then(removeWaiting);
  }

  getState() {
    let {valid, messages, waiting} = this;
    valid = (valid === undefined) ? valid :
      (waiting) ? undefined : valid;
    return {
      waiting: !!waiting,
      valid,
      messages
    };
  }

  forceRequirement(func,
                   failureMessage,
                   generator = this.createPromiseGenerator(func, failureMessage),
                   name,
                   forced = true,
                   isAsync = false
                  ) {
    this.rules = [...this.rules, { forced, generator, name, isAsync }];
    return new ValidationUnit(this);
  }

  setRequirement(func, failureMessage, name) {
    let matchingFuncs = this.rules.filter((rule) => !rule.forced)
                                  .map((rule) => rule.name)
                                  .filter((testName) => testName === name);
    if (matchingFuncs.length) {
      return this;
    }
    return this.forceRequirement(func, failureMessage, undefined, name, false);
  }

  setValidatorRequirement(funcName, message, ...extraParams) {
    return this.setRequirement(val => validator[funcName](val, ...extraParams), message, funcName);
  }

  isValidatedBy(func, message) {
    return this.forceRequirement((val, allValues) => func(val, allValues), message);
  }

  isEventuallyValidatedBy(func, message) {
    let generator = this.createCustomPromiseGenerator((val, allValues, messageList, name, resolve, reject) => {
      func(val, allValues, resolve, () => {
        messageList.push(formatValidationMessage(message, { name }));
        reject();
      });
    });
    return this.forceRequirement(func, message, generator, 'isEventuallyValidatedBy', true, true);
  }

  isRequired(message = '{name} is required.') {
    return this.setRequirement(requiredFunc, message, 'isRequired');
  }

  isEmail(message = '{name} must be a valid email address.') {
    return this.setValidatorRequirement('isEmail', message);
  }

  contains(needle, message = '{name} must contain "{needle}."') {
    return this.setRequirement((val) => validator.contains(val, needle), formatValidationMessage(message, {needle}), `contains ${needle}`);
  }

  removeContains(needle) {
    return this.remove(`contains ${needle}`);
  }

  equals(comparison, message = '{name} must equal "{comparison}."') {
    return this.setRequirement((val) => validator.equals(val, comparison), formatValidationMessage(message, {comparison}), `equals ${comparison}`);
  }

  removeEquals(comparison) {
    return this.remove(`equals ${comparison}`);
  }

  equalsOther(other, message = '{name} must be equal to {other}.') {
    return this.setRequirement((val, others) => validator.equals(val, others[other]), formatValidationMessage(message, {other}), `equalsOther ${other}`);
  }

  removeEqualsOther(other, message = '{name} must be equal to {other}.') {
    return this.setRequirement((val, others) => validator.equals(val, others[other]), formatValidationMessage(message, {other}), `equalsOther ${other}`);
  }

  isAfter(date, message = '{name} must be after {date}.') {
    return this.setRequirement((val) => {
      let dates = getDates(date, val);
      return validator.isAfter(dates.after, dates.before);
    }, formatValidationMessage(message, { date }), 'isAfter');
  }

  isBefore(date, message = '{name} must be before {date}.') {
    return this.setRequirement((val) => {
      let dates = getDates(val, date);
      return validator.isBefore(dates.before, dates.after);
    }, formatValidationMessage(message, { date }), 'isBefore');
  }

  isAlpha(message = '{name} must use only alphabetical characters.') {
    return this.setValidatorRequirement('isAlpha', message);
  }

  isAlphanumeric(message = '{name} must use only alphanumeric characters.') {
    return this.setValidatorRequirement('isAlphanumeric', message);
  }

  isAscii(message = '{name} must use only ASCII characters.') {
    return this.setValidatorRequirement('isAscii', message);
  }

  isBase64(message = '{name} must be base64 encoded.') {
    return this.setValidatorRequirement('isBase64', message);
  }

  isBoolean(message = '{name} must be a boolean value.') {
    return this.setValidatorRequirement('isBoolean', message);
  }

  isByteLength(min, max, message = '{name} must have a minimum byte length of {min}.') {
    return this.setValidatorRequirement('isByteLength',
                                        formatValidationMessage(message, {min, max}),
                                        min, max);
  }

  isCreditCard(message = '{name} must be a credit card number.') {
    return this.setValidatorRequirement('isCreditCard', message);
  }

  isCurrency(options = defaultCurrencyOptions,
             message = '{name} must be in the format "{format}". {extraInfo}',
             extraInfoMessage = '(Currency symbol ({symbol}) {notOrIs} required.)') {
    let computedOptions = {
      ...defaultCurrencyOptions,
      ...options
    };
    let symbol = computedOptions.require_symbol ? computedOptions.symbol : '';
    let symbolStart = computedOptions.symbol_after_digits ? '' : symbol;
    let symbolEnd = computedOptions.symbol_after_digits ? symbol : '';
    let notOrIs = (computedOptions.require_symbol) ? 'is' : 'not';
    let formattedExtra = formatValidationMessage(extraInfoMessage, { ...computedOptions, notOrIs });
    let extraInfo = computedOptions.include_extra_info ? formattedExtra : '';
    let {thousands_separator, decimal_separator} = computedOptions;
    let format = `${symbolStart}1${thousands_separator}000${decimal_separator}00${symbolEnd}`;
    let messageWithFormat = formatValidationMessage(message, {format, extraInfo, ...computedOptions}).trim();
    return this.setValidatorRequirement('isCurrency', messageWithFormat, computedOptions);
  }

  isDate(message = '{name} must be a date.') {
    return this.setValidatorRequirement('isDate', message);
  }

  isDecimal(message = '{name} must represent a decimal number.') {
    return this.setValidatorRequirement('isDecimal', message);
  }

  isDivisibleBy(number, message = '{name} must be divisible by {number}.') {
    return this.setValidatorRequirement('isDivisibleBy', formatValidationMessage(message, {number}), number);
  }

  isFQDN(options = defaultFqdnOptions, message = '{name} must be a fully qualified domain name.') {
    return this.setValidatorRequirement('isFQDN', message, options);
  }

  isFloat(options, message = '{name} must be a float.') {
    return this.setValidatorRequirement('isFloat', message, options);
  }

  isFullWidth(message = '{name} must contain fullwidth characters.') {
    return this.setValidatorRequirement('isFullWidth', message);
  }

  isHalfWidth(message = '{name} must contain halfwidth characters.') {
    return this.setValidatorRequirement('isHalfWidth', message);
  }

  isVariableWidth(message = '{name} must contain fullwidth and halfwidth characters.') {
    return this.setValidatorRequirement('isVariableWidth', message);
  }

  isHexColor(message = '{name} must be a hex color.') {
    return this.setValidatorRequirement('isHexColor', message);
  }

  isHexadecimal(message = '{name} must be a hexadecimal number.') {
    return this.setValidatorRequirement('isHexadecimal', message);
  }

  isIP(version, message = '{name} must be an IP address.') {
    return this.setValidatorRequirement('isIP', message, version);
  }

  isISBN(version, message = '{name} must be an ISBN.') {
    return this.setValidatorRequirement('isISBN', message, version);
  }

  isISIN(message = '{name} must be an ISIN.') {
    return this.setValidatorRequirement('isISIN', message);
  }

  isISO8601(message = '{name} must be an ISO6801 date.') {
    return this.setValidatorRequirement('isISO8601', message);
  }

  isIn(values, message = '{name} must be contained in {values}.') {
    let formattedMessage = formatValidationMessage(message, { values: JSON.stringify(values) });
    return this.setValidatorRequirement('isIn', formattedMessage, values);
  }

  isInt(options, message = '{name} must be an integer.') {
    return this.setValidatorRequirement('isInt', message, options);
  }

  isJSON(message = '{name} must be JSON.') {
    return this.setValidatorRequirement('isJSON', message);
  }

  isLength(min, max, message = '{name} must be at least {min} characters.') {
    var formattedMessage = formatValidationMessage(message, {min, max});
    return this.setValidatorRequirement('isLength', formattedMessage, min, max);
  }

  isLowercase(message = '{name} must be lowercase.') {
    return this.setValidatorRequirement('isLowercase', message);
  }

  isUppercase(message = '{name} must be uppercase.') {
    return this.setValidatorRequirement('isUppercase', message);
  }

  isMobilePhone(locale = 'en-US', message = '{name} must be a phone number.') {
    return this.setValidatorRequirement('isMobilePhone', message, locale);
  }

  isMongoId(message = '{name} must be a MongoDB id.') {
    return this.setValidatorRequirement('isMongoId', message);
  }

  isMultibyte(message = '{name} must contain multibyte characters.') {
    return this.setValidatorRequirement('isMultibyte', message);
  }

  isNumeric(message = '{name} must be numeric.') {
    return this.setValidatorRequirement('isNumeric', message);
  }

  isSurrogatePair(message = '{name} must be a surrogate pair.') {
    return this.setValidatorRequirement('isSurrogatePair', message);
  }

  isURL(options, message = '{name} must be a url.') {
    return this.setValidatorRequirement('isURL', message, options);
  }

  isUUID(version, message = '{name} must be a UUID.') {
    return this.setValidatorRequirement('isUUID', message, version);
  }

  matches(pattern, modifiers, message = '{name} must match {pattern}.') {
    let formattedMessage = formatValidationMessage(message, {pattern});
    return this.setRequirement(val => validator.matches(val, pattern), formattedMessage, `matches ${pattern.toString()}`);
  }

  removeMatches(pattern) {
    return this.remove(`matches ${pattern.toString()}`);
  }
}
