import ValidationUnit, { ValidationRule } from './ValidationUnit-new';

let unit: ValidationUnit;
beforeEach(() => {
  unit = new ValidationUnit();
});
describe('constructor', () => {
  it('creates an empty list without any other units', () => {
    expect(unit.rules).toHaveLength(0);
  });

  it('will duplicate the rules of another ValidationUnit', () => {
    unit = new ValidationUnit();
    unit.rules = [
      {
        discrete: true,
        validationFunction: (): boolean => true,
        name: 'hello',
        failureMessage: 'hello failed',
        isAsync: false
      },
      {
        discrete: false,
        validationFunction: (): boolean => true,
        name: 'hola',
        failureMessage: 'hola failed',
        isAsync: false
      }
    ];
    expect(new ValidationUnit(unit).rules).toEqual(unit.rules);
  });

  it('will set its valid property to the valid property of an existing ValidationUnit', () => {
    unit.isValid = true;
    expect(new ValidationUnit(unit).isValid).toBeTruthy();
  });

  it('will set its messages to the messages of an existing ValidationUnit', () => {
    unit.messages = ['Test Message', 'Test Message 2'];
    expect(new ValidationUnit(unit).messages).toEqual(unit.messages);
  });
});

describe('adding rules', () => {
  it('will not add duplicate rules', () => {
    unit.isEmail().isEmail();
    expect(unit.rules.length).toBe(1);
  });

  it('will chain rules together', () => {
    unit.isEmail().isRequired();
    expect(unit.rules.length).toBe(2);
  });
});

describe('runValidation', () => {
  let defaultRule: ValidationRule;
  beforeEach(() => {
    defaultRule = {
      validationFunction: (): boolean => false,
      failureMessage: 'fake message',
      name: 'Test Rule',
      discrete: true,
      isAsync: false
    };
    unit.rules.push(defaultRule);
  });
  describe('when we have no required rules', () => {
    it('is valid if we do not have a checkable value', async () => {
      await unit.runValidation('', {}, 'Test Rule');
      expect(unit.isValid).toBeTruthy();
    });

    it('is valid if the value provided is undefined', async () => {
      await unit.runValidation(undefined, {}, 'Test Rule');
      expect(unit.isValid).toBeTruthy();
    });

    it('is valid if the value provided is null', async () => {
      await unit.runValidation(null, {}, 'Test Rule');
      expect(unit.isValid).toBeTruthy();
    });

    it('runs validation if we have a checkable value', async () => {
      await unit.runValidation('hello friend!', {}, 'Test Rule');
      expect(unit.isValid).toBeFalsy();
      expect(unit.messages).toEqual([defaultRule.failureMessage]);
    });
  });

  describe('when we have required rules', () => {
    beforeEach(() => {
      defaultRule.name = 'isRequired';
    });
    it('runs validation for an empty string when any rule is named "isRequired"', async () => {
      await unit.runValidation('', {}, 'Test Rule');
      expect(unit.isValid).toBeFalsy();
      expect(unit.messages).toEqual([defaultRule.failureMessage]);
    });

    it('runs validation for null when any rule is named "isRequired"', async () => {
      await unit.runValidation(null, {}, 'Test Rule');
      expect(unit.isValid).toBeFalsy();
      expect(unit.messages).toEqual([defaultRule.failureMessage]);
    });

    it('runs validation for undefined when any rule is named "isRequired"', async () => {
      await unit.runValidation(undefined, {}, 'Test Rule');
      expect(unit.isValid).toBeFalsy();
      expect(unit.messages).toEqual([defaultRule.failureMessage]);
    });
  });

  it('will fail when we have a single failure, even if other rules pass', async () => {
    unit.rules.unshift({
      validationFunction: (): boolean => true,
      failureMessage: 'fake message',
      name: 'Test Passing Rule',
      discrete: true,
      isAsync: false
    });
    await unit.runValidation('test value', {}, 'Test Rule');
    expect(unit.isValid).toBeFalsy();
    expect(unit.messages).toEqual([defaultRule.failureMessage]);
  });

  it('will pass when all rules pass', async () => {
    unit.rules = [
      {
        validationFunction: (): boolean => true,
        failureMessage: 'fake message',
        name: 'Test Passing Rule',
        discrete: true,
        isAsync: false
      }
    ];
    await unit.runValidation('test value', {}, 'Test Rule');
    expect(unit.isValid).toBeTruthy();
    expect(unit.messages).toEqual([]);
  });

  it('will not re-run validation while waiting for async rules', () => {
    let validationCalled = 0;
    unit.rules.push({
      validationFunction: async () => {
        return await new Promise<boolean>(resolve => {
          validationCalled += 1;
          setTimeout(() => {
            resolve(true);
          });
        });
      },
      failureMessage: 'Async rule failed',
      name: 'Test Async Rule',
      discrete: true,
      isAsync: true
    });
    unit.runValidation('test value', {}, 'Test Repeated Calls').then(() => {
      expect(validationCalled).toBe(1);
    });
    unit.runValidation('test value', {}, 'Test Repeated Calls');
    unit.runValidation('test value', {}, 'Test Repeated Calls');
    return unit.runValidation('test value', {}, 'Test Repeated Calls');
  });

  describe('runvalidationSync', () => {
    it('does not run async functions', () => {
      let didRunAsync = false;
      defaultRule.validationFunction = (): boolean => true;
      unit.rules.push({
        validationFunction: (): boolean => {
          return (didRunAsync = true), false;
        },
        failureMessage: 'Async rule failed',
        name: 'Test Async Rule',
        discrete: true,
        isAsync: true
      });
      unit.runValidationSync('test value', {}, 'Test Rule');
      expect(didRunAsync).toBeFalsy();
      expect(unit.isValid).toBeTruthy();
      expect(unit.messages).toEqual([]);
    });
  });
});

describe('getValidationState', () => {
  beforeEach(() => {
    unit.isEmail();
  });

  it('sets valid to true if the current ValidationUnit is not required, the unit has no current value, and valid has no current value', () => {
    unit.value = undefined;
    unit.isValid = undefined;
    expect(unit.getValidationState().isValid).toBeTruthy();
  });

  it('valid keeps its current value if the unit has a current value', () => {
    unit.value = 'anycurrentvalue';

    unit.isValid = undefined;
    expect(unit.getValidationState().isValid).toBeUndefined();

    unit.isValid = false;
    expect(unit.getValidationState().isValid).toBeFalsy();

    unit.isValid = true;
    expect(unit.getValidationState().isValid).toBeTruthy();
  });

  it('valid keeps its current value if the ValidationUnit is required and the unit has no current value', () => {
    unit = new ValidationUnit().isEmail().isRequired();
    unit.value = undefined;

    unit.isValid = undefined;
    expect(unit.getValidationState().isValid).toBeUndefined();

    unit.isValid = false;
    expect(unit.getValidationState().isValid).toBeFalsy();

    unit.isValid = true;
    expect(unit.getValidationState().isValid).toBeTruthy();
  });

  it('sets valid to undefined if we are waiting for a result', () => {
    unit.isValid = false;
    unit.waiting = true;
    expect(unit.getValidationState().isValid).toBeUndefined();
  });
});

describe('isValidatedBy', () => {
  const matches = ['foo', 'bar'];
  beforeEach(() => {
    unit = unit.isValidatedBy(
      value => !!matches.filter(match => value.includes(match)).length,
      'Value should contain "foo" or "bar".'
    );
  });

  it('will pass a custom validator', async () => {
    await unit.runValidation('foo', {}, 'custom rule');
    expect(unit.getValidationState().isValid).toBeTruthy();
  });

  it('will fail a custom validator', async () => {
    await unit.runValidation('blah', {}, 'custom rule');
    expect(unit.getValidationState().isValid).toBeFalsy();
    expect(unit.getValidationState().messages).toEqual([
      'Value should contain "foo" or "bar".'
    ]);
  });

  describe('checking against other values', () => {
    beforeEach(() => {
      unit = unit.isValidatedBy((value, allValues) => {
        return value === allValues.dependent;
      }, 'Value must be equal to "dependent."');
    });

    it('passes when its dependent values are correct', async () => {
      await unit.runValidation('foo', { dependent: 'foo' }, 'custom rule');
      expect(unit.getValidationState().isValid).toBeTruthy();
    });

    it('fails when its dependent values are not correct', async () => {
      await unit.runValidation('foo', { dependent: 'bar' }, 'custom rule');
      expect(unit.getValidationState().isValid).toBeFalsy();
      expect(unit.getValidationState().messages).toEqual([
        'Value must be equal to "dependent."'
      ]);
    });

    it('will fail with multiple validation messages', async () => {
      await unit.runValidation('doo', { dependent: 'bar' }, 'custom rule');
      expect(unit.getValidationState().isValid).toBeFalsy();
      expect(unit.getValidationState().messages).toEqual([
        'Value should contain "foo" or "bar".',
        'Value must be equal to "dependent."'
      ]);
    });
  });

  describe('removing isValidatedBy', () => {
    const validationFunction = (val: string): boolean => val === 'exact value';
    const failureMessage = '{name} must be exactly "exact value"';
    beforeEach(() => {
      unit = new ValidationUnit().isValidatedBy(
        validationFunction,
        failureMessage
      );
    });
    it('can be removed referencing the validation function', () => {
      unit.removeIsValidatedBy(validationFunction);
      expect(unit.rules.length).toBe(0);
    });
    it('can be removed referencing the failure message', () => {
      unit.removeIsValidatedBy(failureMessage);
      expect(unit.rules.length).toBe(0);
    });
  });
});

describe('isRequiredWhen', () => {
  let shouldBeRequired: boolean;
  const shouldBeRequiredFunc = () => shouldBeRequired;
  const requiredFailureMessage = '{name} is required.';

  beforeEach(() => {
    shouldBeRequired = false;
    unit = unit.isRequiredWhen(shouldBeRequiredFunc);
  });

  it('fails when the value is not present and it is required', async () => {
    shouldBeRequired = true;

    await unit.runValidation(null, {}, 'required input');
    const result = unit.getValidationState();
    expect(result.isValid).toBeFalsy();
    expect(unit.getValidationState().messages).toEqual([
      'required input is required.'
    ]);
  });

  it('passes when the value is not present, but it is not required', async () => {
    shouldBeRequired = false;

    await unit.runValidation(null, {}, 'required input');
    expect(unit.getValidationState().isValid).toBeTruthy();
  });

  it('fails on empty strings when the value is required', async () => {
    shouldBeRequired = true;

    await unit.runValidation('', {}, 'required input');
    expect(unit.getValidationState().isValid).toBeFalsy();
  });

  it('passes on empty strings when the value is not required', async () => {
    shouldBeRequired = false;

    await unit.runValidation('', {}, 'required input');
    expect(unit.getValidationState().isValid).toBeTruthy();
  });

  it('passes when value is present and it is required', async () => {
    shouldBeRequired = true;

    await unit.runValidation("I'm here!", {}, 'required input');
    expect(unit.getValidationState().isValid).toBeTruthy();
  });

  it('passes when value is present and it is not required', async () => {
    shouldBeRequired = false;

    await unit.runValidation("I'm here!", {}, 'required input');
    expect(unit.getValidationState().isValid).toBeTruthy();
  });

  it('can be removed', () => {
    unit.removeIsRequiredWhen();
    expect(unit.rules.length).toBe(0);
  });
});

describe('contains', () => {
  beforeEach(() => {
    unit = unit.contains('foo');
  });

  it('passes when the value is contained', async () => {
    await unit.runValidation('food', {}, 'food test');
    expect(unit.getValidationState().isValid).toBeTruthy();
  });

  it('passes when the value is not contained', async () => {
    await unit.runValidation('eat', {}, 'Foo input');
    expect(unit.getValidationState().isValid).toBeFalsy();
    expect(unit.getValidationState().messages).toEqual([
      'Foo input must contain "foo."'
    ]);
  });

  it('can be removed by the needle', () => {
    unit.removeContains('foo');
    expect(unit.rules.length).toBe(0);
  });
});

describe('equals', () => {
  beforeEach(() => {
    unit = unit.equals('one');
  });

  it('passes when the value is equal', async () => {
    await unit.runValidation('one', {}, '"One" input');
    expect(unit.getValidationState().isValid).toBeTruthy();
  });

  it('fails when the value is not equal', async () => {
    await unit.runValidation('onex', {}, '"One" input');
    const result = unit.getValidationState();
    expect(result.isValid).toBeFalsy();
    expect(result.messages).toEqual(['"One" input must equal "one."']);
  });

  it('can be removed by the comparison', () => {
    unit.removeEquals('one');
    expect(unit.rules.length).toBe(0);
  });
});

describe('equalsOther', () => {
  beforeEach(() => {
    unit = unit.equalsOther('confirmation');
  });

  it('passes when the value is equal with the given other', async () => {
    await unit.runValidation(
      'yep',
      {
        confirmation: 'yep'
      },
      'repeat yep input'
    );
    expect(unit.getValidationState().isValid).toBeTruthy();
  });

  it('fails when the value is not equal with the given other', async () => {
    await unit.runValidation(
      'nope',
      {
        confirmation: 'yep'
      },
      'This guy'
    );
    const result = unit.getValidationState();
    expect(result.isValid).toBeFalsy();
    expect(result.messages).toEqual([
      'This guy must be equal to confirmation.'
    ]);
  });

  it('can be removed by the name of the otehr field', () => {
    unit.removeEqualsOther('confirmation');
    expect(unit.rules.length).toBe(0);
  });
});

describe('isAfter', () => {
  beforeEach(() => {
    unit = unit.isAfter('1/1/2014');
  });

  it('passes when the value is after the given date', async () => {
    await unit.runValidation('1/1/2015', {}, 'Date input');
    expect(unit.getValidationState().isValid).toBeTruthy();
  });

  it('fails when the given value is before the given date', async () => {
    await unit.runValidation('1/1/2013', {}, 'Date input');
    const result = unit.getValidationState();
    expect(result.isValid).toBeFalsy();
    expect(result.messages).toEqual([
      'Date input must be a date after 1/1/2014.'
    ]);
  });

  it('can be removed by date', () => {
    unit.removeIsAfter('1/1/2014');
    expect(unit.rules.length).toBe(0);
  });
});

describe('isBefore', () => {
  beforeEach(() => {
    unit = unit.isBefore('1/1/2014');
  });

  it('passes when the value is after the given date', async () => {
    await unit.runValidation('1/1/2013', {}, 'Date input');
    expect(unit.getValidationState().isValid).toBeTruthy();
  });

  it('fails when the given value is before the given date', async () => {
    await unit.runValidation('1/1/2015', {}, 'Date input');
    const result = unit.getValidationState();
    expect(result.isValid).toBeFalsy();
    expect(result.messages).toEqual([
      'Date input must be a date before 1/1/2014.'
    ]);
  });

  it('can be removed by date', () => {
    unit.removeIsBefore('1/1/2014');
    expect(unit.rules.length).toBe(0);
  });
});

describe('isByteLength', function() {
  beforeEach(function() {
    unit = unit.isByteLength(3);
  });

  it('passes when the string is the correct byte length', async () => {
    await unit.runValidation('foo', {}, 'Bytelength field');
    expect(unit.getValidationState().isValid).toBeTruthy();
  });

  it('fails when the string is the incorrect byte length', async () => {
    await unit.runValidation('o', {}, 'Bytelength field');
    const result = unit.getValidationState();
    expect(result.isValid).toBeFalsy();
    expect(result.messages).toEqual([
      'Bytelength field must have a minimum byte length of 3.'
    ]);
  });

  it('fails when the string is greater than the max byte length', async () => {
    unit = unit.isByteLength(0, 3, '{name} must be shorter than 3 bytes.');
    await unit.runValidation('food', {}, 'Bytelength field');
    const result = unit.getValidationState();
    expect(result.isValid).toBeFalsy();
    expect(result.messages).toEqual([
      'Bytelength field must be shorter than 3 bytes.'
    ]);
  });

  it('can be removed by number', () => {
    unit.removeIsByteLength(3);
    expect(unit.rules.length).toBe(0);
  });
});

/* eslint-disable @typescript-eslint/camelcase */
describe('isCurrency', () => {
  beforeEach(() => {
    unit = unit.isCurrency({
      symbol: '€',
      require_symbol: true
    });
  });

  it('passes when the value is currency in the proper format', async () => {
    await unit.runValidation('€1,000', {}, 'currency-test');
    expect(unit.getValidationState().isValid).toBeTruthy();
  });

  it('fails with a correct validation message, symbol first by default, when required', async () => {
    await unit.runValidation('$100', {}, 'Currency field');
    const result = unit.getValidationState();
    expect(result.isValid).toBeFalsy();
    expect(result.messages).toEqual([
      'Currency field must be in the format "€1,000.00".'
    ]);
  });

  it('fails with a correct validation message, symbol after when configured that way and required', async () => {
    unit = new ValidationUnit().isCurrency({
      symbol: '€',
      require_symbol: true,
      symbol_after_digits: true
    });
    await unit.runValidation('$100', {}, 'Currency field');
    const result = unit.getValidationState();
    expect(result.isValid).toBeFalsy();
    expect(result.messages).toEqual([
      'Currency field must be in the format "1,000.00€".'
    ]);
  });

  it('fails with a correct validation message when the symbol is not required', async () => {
    unit = new ValidationUnit().isCurrency({
      symbol: '€'
    });
    await unit.runValidation('$100', {}, 'Currency field');
    const result = unit.getValidationState();
    expect(result.isValid).toBeFalsy();
    expect(result.messages).toEqual([
      'Currency field must be in the format "1,000.00".'
    ]);
  });
});
/* eslint-enable @typescript-eslint/camelcase */
