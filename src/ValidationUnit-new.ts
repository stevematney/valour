import { isUndefined, isNull } from 'lodash/lang';
import formatValidationMessage from './util/format-validation-message';

type DynamicObject = { [k: string]: any };
export interface ValidationRule {
  validationFunction: (
    value?: string,
    allValues?: DynamicObject
  ) => boolean | Promise<boolean>;
  failureMessage: string;
  name: string;
  discrete: boolean;
  isAsync: boolean;
}

type BooleanValidationFunction = (
  value?: string,
  allValues?: DynamicObject
) => boolean;

interface BooleanValidationRule extends ValidationRule {
  validationFunction: BooleanValidationFunction;
}

const defaultValidationRule: BooleanValidationRule = {
  validationFunction: () => false,
  failureMessage: 'default validation message',
  name: 'Default Rule',
  discrete: false,
  isAsync: false
};

interface ValidationResult {
  isValid: boolean;
  message: string;
}

interface ValidationState {
  isValid: boolean;
  messages: string[];
  waiting: boolean;
}

export default class ValidationUnit {
  rules: ValidationRule[];
  isValid: boolean;
  value: string;
  messages: string[];
  waiting = false;
  constructor(...existingUnits: ValidationUnit[]) {
    const validationState = existingUnits
      .filter(unit => unit.isValid !== undefined || unit.messages !== undefined)
      .shift();
    this.isValid = validationState?.isValid;
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
  runValidation(
    value: string,
    allValues: DynamicObject,
    name: string
  ): Promise<void> {
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
  runValidationSync(
    value: string,
    allValues: DynamicObject,
    name: string
  ): void {
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

  initializeState(isValid: boolean, messages: string[]): ValidationUnit {
    this.isValid = isValid;
    this.messages = messages;
    return this;
  }

  getValidationState(): ValidationState {
    const { isValid, messages, waiting, value } = this;
    let actuallyIsValid =
      !this.shouldCheckValue(value) && value === undefined ? true : isValid;
    if (waiting) {
      actuallyIsValid = undefined;
    }
    return {
      waiting,
      isValid: actuallyIsValid,
      messages
    };
  }

  isValidatedBy(
    validationFunction: (val: string, allValues: DynamicObject) => boolean,
    failureMessage: string
  ): ValidationUnit {
    return this.setRequirement({
      validationFunction,
      failureMessage,
      name: failureMessage,
      discrete: true,
      isAsync: false
    });
  }
  removeIsValidatedBy(
    criteria: BooleanValidationFunction | string
  ): ValidationUnit {
    if (criteria instanceof Function) {
      this.rules = this.rules.filter(
        rule => rule.validationFunction !== criteria
      );
      return this;
    }
    this.remove({
      ...defaultValidationRule,
      name: criteria
    });
    return this;
  }

  private setRequirement(newRule: ValidationRule): ValidationUnit {
    const matchingRules = this.rules
      .filter(rule => !rule.discrete)
      .filter(rule => rule.name === newRule.name);
    if (matchingRules.length && !newRule.discrete) return this;

    this.rules.push(newRule);
    return this;
  }
  private checkRules<T>(
    value: string,
    allValues: DynamicObject,
    name: string,
    checkingFunction: (
      value: string,
      allValues: DynamicObject,
      name: string
    ) => T
  ): T {
    this.value = value;
    this.isValid = undefined;
    this.messages = [];

    if (!this.shouldCheckValue(value)) {
      this.isValid = true;
      return;
    }

    return checkingFunction(value, allValues, name);
  }
  private setValidity(results: ValidationResult[]): void {
    this.messages = results
      .map(rule => rule.message)
      .filter(message => message);
    this.isValid = results.every(result => result.isValid);
  }
  private remove(removedRule: ValidationRule): ValidationUnit {
    this.rules = this.rules.filter(rule => rule.name !== removedRule.name);
    return this;
  }
  private shouldCheckValue(value: string): boolean {
    const hasRequiredRules = this.rules.some(x => x.name === 'isRequired');
    const isCheckable =
      !isUndefined(value) && !isNull(value) && !!value.toString();
    return hasRequiredRules || isCheckable;
  }
}
