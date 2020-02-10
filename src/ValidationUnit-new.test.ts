import ValidationUnit, { ValidationRule } from './ValidationUnit-new';

describe('constructor', () => {
  it('creates an empty list without any other units', () => {
    const unit = new ValidationUnit();
    expect(unit.rules).toHaveLength(0);
  });

  it('will duplicate the rules of another ValidationUnit', () => {
    const fakeUnit = new ValidationUnit();
    fakeUnit.rules = [
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
    expect(new ValidationUnit(fakeUnit).rules).toEqual(fakeUnit.rules);
  });

  it('will set its valid property to the valid property of an existing ValidationUnit', () => {
    const fakeUnit = new ValidationUnit();
    fakeUnit.isValid = true;
    expect(new ValidationUnit(fakeUnit).isValid).toBeTruthy();
  });

  it('will set its messages to the messages of an existing ValidationUnit', () => {
    const fakeUnit = new ValidationUnit();
    fakeUnit.messages = ['Test Message', 'Test Message 2'];
    expect(new ValidationUnit(fakeUnit).messages).toEqual(fakeUnit.messages);
  });
});

describe('adding rules', () => {
  let unit: ValidationUnit;
  beforeEach(() => {
    unit = new ValidationUnit();
  });

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
  let unit: ValidationUnit;
  let defaultRule: ValidationRule;
  beforeEach(() => {
    unit = new ValidationUnit();
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

describe('getValidationState', function() {
  let unit: ValidationUnit;
  beforeEach(function() {
    unit = new ValidationUnit().isEmail();
  });

  it('sets valid to true if the current ValidationUnit is not required, the unit has no current value, and valid has no current value', function() {
    unit.value = undefined;
    unit.isValid = undefined;
    expect(unit.getValidationState().isValid).toBeTruthy();
  });

  it('valid keeps its current value if the unit has a current value', function() {
    unit.value = 'anycurrentvalue';

    unit.isValid = undefined;
    expect(unit.getValidationState().isValid).toBeUndefined();

    unit.isValid = false;
    expect(unit.getValidationState().isValid).toBeFalsy();

    unit.isValid = true;
    expect(unit.getValidationState().isValid).toBeTruthy();
  });

  it('valid keeps its current value if the ValidationUnit is required and the unit has no current value', function() {
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

describe('isValidatedBy', function() {
  const matches = ['foo', 'bar'];
  let unit: ValidationUnit;
  beforeEach(function() {
    unit = new ValidationUnit().isValidatedBy(
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

  describe('checking against other values', function() {
    beforeEach(function() {
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
