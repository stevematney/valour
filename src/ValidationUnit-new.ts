import { isUndefined, isNull, isBoolean } from 'lodash/lang';
import formatValidationMessage from './util/format-validation-message';
export interface ValidationRule {
  validationFunction(value: string, allValues: object): boolean;
  failureMessage: string;
  name: string;
  discrete: boolean;
  isAsync: boolean;
}

export default class ValidationUnit {
  rules: ValidationRule[];
  valid: boolean;
  value: string;
  messages: string[];
  constructor(...existingUnits: ValidationUnit[]) {
    const validationState = existingUnits
      .filter(unit => unit.valid !== undefined || unit.messages !== undefined)
      .shift();
    this.valid = validationState?.valid;
    this.messages = validationState?.messages;

    const getDistinctRules = (finalRules, rule): ValidationRule[] => {
      const hasEquivalent = finalRules.some(
        existingRule => existingRule.name === rule.name
      );
      if (!rule.discrete && hasEquivalent) return finalRules;
      return [...finalRules, rule];
    };
    this.rules = existingUnits
      .reduce((rules, unit) => rules.concat(unit.rules), [])
      .reduce(getDistinctRules, []);
  }
  remove(name: string): ValidationUnit {
    this.rules = this.rules.filter(rule => rule.name === name);
    return this;
  }
  runValidationSync(value: string, allValues: object, name: string): void {
    this.value = value;
    this.valid = undefined;
    this.messages = [];

    if (!this.shouldCheckValue(value)) {
      this.valid = true;
      return;
    }

    const results = this.rules
      .filter(rule => !rule.isAsync)
      .map(rule => {
        const isValid = rule.validationFunction(value, allValues);
        return {
          isValid,
          message:
            !isValid &&
            rule.failureMessage &&
            formatValidationMessage(rule.failureMessage, { name })
        };
      });
    this.messages = results
      .map(rule => rule.message)
      .filter(message => message);
    this.valid = results.every(result => result.isValid);
  }
  private shouldCheckValue(value: string): boolean {
    const hasRequiredRules = this.rules.some(x => x.name === 'isRequired');
    const isCheckable =
      !isUndefined(value) && !isNull(value) && !!value.toString();
    return hasRequiredRules || isCheckable;
  }
}
