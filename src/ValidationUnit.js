import validator from 'validator';

export default class ValidationUnit {
  constructor(existing = { promiseGenerators: [], funcs: [] }) {
    this.promiseGenerators = [...existing.promiseGenerators];
    this.funcs = [...existing.funcs];
    this.messages = [];
  }

  createPromiseGenerator(func, message) {
    return () => new Promise((resolve, reject) => {
      if (func()) {
        return resolve();
      }
      this.messages = [...this.messages, message];
      return reject();
    });
  }

  runValidation(value) {
    this.value = value;
    this.valid = undefined;
    this.messages = [];
    return Promise.all(this.promiseGenerators.map((gen) => gen()))
    .then(() => this.valid = true, () => this.valid = false)
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
  }

  setRequirement(func, failureMessage) {
    if (this.funcs.filter((testFunc) => testFunc.toString() === func.toString()).length) {
      return this;
    }
    this.forceRequirement(func, failureMessage);
    return this;
  }

  isRequired() {
    return this.setRequirement(() => !!this.value, '{name} is required.')
  }

  isEmail() {
    return this.setRequirement(() => validator.isEmail(this.value), 'Not a valid email');
  }

  isValidatedBy(func, message) {
    return this.setRequirement(() => func(this.value), message);
  }

  isEventuallyValidatedBy(func, message) {
    this.promiseGenerators = [
      ...this.promiseGenerators,
      () => new Promise((resolve, reject) => func(this.value, resolve, () => {
        this.messages = [...this.messages, message];
        reject()
      }))
    ];
    return this;
  }
}
