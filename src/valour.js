import ValidationUnit from './ValidationUnit';

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

  removeOnUpdated(name, callback) {
    if (!callback) {
      return;
    }
    this.callbacks[name] = this.getCallbacks(name).filter((cb) => cb !== callback);
  }

  clearOnUpdated(name) {
    this.callbacks[name] = [];
  }

  getRuleByName(form, ruleName) {
    return form[ruleName] || this.rule;
  }

  get rule() {
    return new ValidationUnit();
  }

  isValidationStateSet(formName) {
    let form = this.getForm(formName);
    return Object.keys(form).some((key) => {
      return form[key].valid !== undefined;
    });
  }

  register(name, config = {}, callback) {
    this.forms[name] = Object.keys(config).reduce((dest, ruleKey) => {
      dest[ruleKey] = new ValidationUnit(config[ruleKey]);
      return dest;
    }, {});
    this.onUpdated(name, callback);
    if (this.isValidationStateSet(name)) {
      this.runCallbacks(name);
    }
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
      console.log('getting state for', key, form[key]);
      result[key] = form[key].getState();
      return result;
    }, {});
  }

  runCallbacks(name) {
    let result = this.getResult(name);
    this.getCallbacks(name).forEach((callback) => {
      callback(result);
    });
  }

  runValidation(name, data, force = false) {
    var callbackTimeout;
    let runCallback = () => {
      clearTimeout(callbackTimeout);
      callbackTimeout = setTimeout(() => {
        this.runCallbacks(name);
      }, 100);
    };
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
    return !Object.keys(result).some((key) => (!result[key].valid));
  }

  setValidationState(name, data) {
    let form = this.getForm(name);
    Object.keys(form).forEach((key) => {
      if (data[key] === undefined) {
        return;
      }
      let { valid, messages } = data[key];
      form[key].setState(valid, messages);
    });
    this.runCallbacks(name);
  }
}

export default new Valour();
