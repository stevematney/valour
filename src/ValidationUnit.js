import validator from 'validator';
import functionsEqual from './util/functions-equal';
import formatMessage from './util/format-message';

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
      messageList.push(formatMessage(name, message))
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

  isRequired(message = '{name} is required.') {
    return this.setRequirement((val) => !!val, '{name} is required.')
  }

  isValidatedBy(func, message) {
    return this.forceRequirement((val, allValues) => func(val, allValues), message);
  }

  isEventuallyValidatedBy(func, message) {
    let generator = this.createCustomPromiseGenerator((val, allValues, messageList, name, resolve, reject) => func(val, allValues, resolve, () => {
      messageList.push(formatMessage(name, message));
      reject();
    }));
    return this.forceRequirement(func, message, generator);
  }

  isEmail() {
    return this.setRequirement((val) => validator.isEmail(val), 'Not a valid email');
  }
}
