interface ValidationRule {
  validationFunction(value: any): boolean;
  failureMessage: string;
  name: string;
  discrete: boolean;
  isAsync: boolean;
}

export default class ValidationUnit {
  rules: ValidationRule[];
  valid: boolean;
  messages: string[];
  constructor(...existingUnits: ValidationUnit[]) {
    const validationState = existingUnits
      .filter(unit => unit.valid !== undefined || unit.messages !== undefined)
      .shift();
    this.valid = validationState?.valid;
    this.messages = validationState?.messages;

    const getDistinctRules = (finalRules, rule) => {
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
}
