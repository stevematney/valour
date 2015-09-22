import validator from 'validator';

export default class ValidationUnit {
  constructor(existing = { promiseGenerators: [], funcs: [] }) {
    this.promiseGenerators = [...existing.promiseGenerators];
    this.funcs = [...existing.funcs];
  }

  createPromiseGenerator(func, message) {
    return (val, messageList) => new Promise((resolve, reject) => {
      if (func(val)) {
        return resolve();
      }
      messageList.push(message);
      return reject();
    });
  }

  runValidation(value) {
    this.valid = undefined;
    this.messages = [];
    return Promise.all(this.promiseGenerators.map((gen) => gen(value, this.messages)))
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

  forceRequirement(func, failureMessage) {
    this.funcs = [...this.funcs, func];
    this.promiseGenerators = [
      ...this.promiseGenerators,
      this.createPromiseGenerator(func, failureMessage)
    ];
    return new ValidationUnit(this);
  }

  setRequirement(func, failureMessage) {
    if (this.funcs.filter((testFunc) => testFunc.toString() === func.toString()).length) {
      return this;
    }
    return this.forceRequirement(func, failureMessage);
  }

  isRequired() {
    return this.setRequirement((val) => !!val, '{name} is required.')
  }

  isEmail() {
    return this.setRequirement((val) => validator.isEmail(val), 'Not a valid email');
  }

  isValidatedBy(func, message) {
    return this.forceRequirement((val) => func(val), message);
  }

  isEventuallyValidatedBy(func, message) {
    this.promiseGenerators = [
      ...this.promiseGenerators,
      (val, messageList) => new Promise((resolve, reject) => func(val, resolve, () => {
        messageList.push(message);
        reject();
      }))
    ];
    return new ValidationUnit(this);
  }
}
