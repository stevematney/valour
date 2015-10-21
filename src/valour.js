import ValidationUnit from './ValidationUnit';
import throttle from 'lodash/function/throttle';

class Valour {
  constructor() {
    this.forms = {};
    this.callbacks = {};
  }

  getForm(name) {
    this.forms[name] = this.forms[name] || {};
    return this.forms[name];
  }

  getCallbacks(name) {
    this.callbacks[name] = this.callbacks[name] || [];
    return this.callbacks[name];
  }

  onUpdated(name, callback) {
    if (!callback) {
      return;
    }
    let callbacks = this.getCallbacks(name);
    this.callbacks[name] = [...callbacks, callback];
  }

  getRuleByName(form, ruleName) {
    return form[ruleName] || this.rule;
  }

  get rule() {
    return new ValidationUnit();
  }

  register(name, config = {}, callback) {
    this.forms[name] = Object.keys(config).reduce((dest, ruleKey) => {
      dest[ruleKey] = new ValidationUnit(config[ruleKey]);
      return dest;
    }, {});
    this.onUpdated(name, callback);
  }

  update(name, config = {}, callback) {
    let form = this.getForm(name);
    Object.keys(config).forEach((key) => {
      form[key] = new ValidationUnit(this.getRuleByName(form, key), config[key]);
    });
    this.onUpdated(name, callback);
  }

  getResult(name) {
    let form = this.getForm(name);
    return Object.keys(form).reduce((result, key) => {
      result[key] = form[key].getState();
      return result;
    }, {});
  }

  runValidation(name, data, force = false) {
    let runCallback = throttle(() => {
      let callbacks = this.getCallbacks(name);
      let result = this.getResult(name);
      callbacks.forEach((callback) => {
        callback(result);
      });
    }, 100);
    let form = this.getForm(name);
    Object.keys(form).forEach((key) => {
      if (data[key] === undefined && !force) {
        return;
      }
      form[key].runValidation(data[key], data, key).then(runCallback);
    });
  }

  forceValidation(name, data) {
    this.runValidation(name, data, true);
  }

  isValid(name) {
    let result = this.getResult(name);
    return !Object.keys(result).some((key) => !result[key].valid);
  }
}

export default new Valour();
