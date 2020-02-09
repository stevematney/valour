import { isUndefined, isNull } from 'lodash/lang';
import formatValidationMessage from './util/format-validation-message';

export interface ValidationRule {
  validationFunction: (
    value?: string,
    allValues?: object
  ) => boolean | Promise<boolean>;
  failureMessage: string;
  name: string;
  discrete: boolean;
  isAsync: boolean;
}

interface BooleanValidationRule extends ValidationRule {
  validationFunction: (value?: string, allValues?: object) => boolean;
}

interface ValidationResult {
  isValid: boolean;
  message: string;
}

export default class ValidationUnit {
  rules: ValidationRule[];
  valid: boolean;
  value: string;
  messages: string[];
  waiting = false;
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
  runValidation(value: string, allValues: object, name: string): Promise<void> {
    if (this.waiting && this.value === value) return;
    this.waiting = true;

    return this.checkRules<Promise<void>>(value, allValues, name, async () => {
      const results = [];
      await Promise.all(
        this.rules.map(async rule => {
          const isValid = await rule.validationFunction(value, allValues);
          results.push({
            isValid,
            message:
              !isValid &&
              rule.failureMessage &&
              formatValidationMessage(rule.failureMessage, { name })
          });
        })
      );
      this.setValidity(results);
      this.waiting = false;
    });
  }
  runValidationSync(value: string, allValues: object, name: string): void {
    return this.checkRules<void>(value, allValues, name, () => {
      const results = this.rules
        .filter(rule => !rule.isAsync)
        .map(
          (rule: BooleanValidationRule): ValidationResult => {
            const isValid = rule.validationFunction(value, allValues);
            return {
              isValid,
              message:
                !isValid &&
                rule.failureMessage &&
                formatValidationMessage(rule.failureMessage, { name })
            };
          }
        );
      this.setValidity(results);
    });
  }
  private checkRules<T>(
    value: string,
    allValues: object,
    name: string,
    checkingFunction: (value: string, allValues: object, name: string) => T
  ): T {
    this.value = value;
    this.valid = undefined;
    this.messages = [];

    if (!this.shouldCheckValue(value)) {
      this.valid = true;
      return;
    }

    return checkingFunction(value, allValues, name);
  }
  private setValidity(results: ValidationResult[]): void {
    this.messages = results
      .map(rule => rule.message)
      .filter(message => message);
    this.valid = results.every(result => result.isValid);
  }
  private remove(name: string): ValidationUnit {
    this.rules = this.rules.filter(rule => rule.name === name);
    return this;
  }
  private shouldCheckValue(value: string): boolean {
    const hasRequiredRules = this.rules.some(x => x.name === 'isRequired');
    const isCheckable =
      !isUndefined(value) && !isNull(value) && !!value.toString();
    return hasRequiredRules || isCheckable;
  }
}
