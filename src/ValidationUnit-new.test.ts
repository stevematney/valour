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
    fakeUnit.valid = true;
    expect(new ValidationUnit(fakeUnit).valid).toBeTruthy();
  });

  it('will set its messages to the messages of an existing ValidationUnit', () => {
    const fakeUnit = new ValidationUnit();
    fakeUnit.messages = ['Test Message', 'Test Message 2'];
    expect(new ValidationUnit(fakeUnit).messages).toEqual(fakeUnit.messages);
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
      expect(unit.valid).toBeTruthy();
    });

    it('is valid if the value provided is undefined', async () => {
      await unit.runValidation(undefined, {}, 'Test Rule');
      expect(unit.valid).toBeTruthy();
    });

    it('is valid if the value provided is null', async () => {
      await unit.runValidation(null, {}, 'Test Rule');
      expect(unit.valid).toBeTruthy();
    });

    it('runs validation if we have a checkable value', async () => {
      await unit.runValidation('hello friend!', {}, 'Test Rule');
      expect(unit.valid).toBeFalsy();
      expect(unit.messages).toEqual([defaultRule.failureMessage]);
    });
  });

  describe('when we have required rules', () => {
    beforeEach(() => {
      defaultRule.name = 'isRequired';
    });
    it('runs validation for an empty string when any rule is named "isRequired"', async () => {
      await unit.runValidation('', {}, 'Test Rule');
      expect(unit.valid).toBeFalsy();
      expect(unit.messages).toEqual([defaultRule.failureMessage]);
    });

    it('runs validation for null when any rule is named "isRequired"', async () => {
      await unit.runValidation(null, {}, 'Test Rule');
      expect(unit.valid).toBeFalsy();
      expect(unit.messages).toEqual([defaultRule.failureMessage]);
    });

    it('runs validation for undefined when any rule is named "isRequired"', async () => {
      await unit.runValidation(undefined, {}, 'Test Rule');
      expect(unit.valid).toBeFalsy();
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
    expect(unit.valid).toBeFalsy();
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
    expect(unit.valid).toBeTruthy();
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
      expect(unit.valid).toBeTruthy();
      expect(unit.messages).toEqual([]);
    });
  });
});
