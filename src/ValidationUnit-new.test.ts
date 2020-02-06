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

describe('runValidationSync', () => {
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
    it('is valid if we do not have a checkable value', () => {
      unit.runValidationSync('', {}, 'Test Rule');
      expect(unit.valid).toBeTruthy();
    });

    it('is valid if the value provided is undefined', () => {
      unit.runValidationSync(undefined, {}, 'Test Rule');
      expect(unit.valid).toBeTruthy();
    });

    it('is valid if the value provided is null', () => {
      unit.runValidationSync(null, {}, 'Test Rule');
      expect(unit.valid).toBeTruthy();
    });

    it('runs validation if we have a checkable value', () => {
      unit.runValidationSync('hello friend!', {}, 'Test Rule');
      expect(unit.valid).toBeFalsy();
      expect(unit.messages).toEqual([defaultRule.failureMessage]);
    });
  });

  describe('when we have required rules', () => {
    beforeEach(() => {
      defaultRule.name = 'isRequired';
    });
    it('runs validation for an empty string when any rule is named "isRequired"', () => {
      unit.runValidationSync('', {}, 'Test Rule');
      expect(unit.valid).toBeFalsy();
      expect(unit.messages).toEqual([defaultRule.failureMessage]);
    });

    it('runs validation for null when any rule is named "isRequired"', () => {
      unit.runValidationSync(null, {}, 'Test Rule');
      expect(unit.valid).toBeFalsy();
      expect(unit.messages).toEqual([defaultRule.failureMessage]);
    });

    it('runs validation for undefined when any rule is named "isRequired"', () => {
      unit.runValidationSync(undefined, {}, 'Test Rule');
      expect(unit.valid).toBeFalsy();
      expect(unit.messages).toEqual([defaultRule.failureMessage]);
    });
  });

  it('will fail when we have a single failure, even if other rules pass', () => {
    unit.rules.unshift({
      validationFunction: (): boolean => true,
      failureMessage: 'fake message',
      name: 'Test Passing Rule',
      discrete: true,
      isAsync: false
    });
    unit.runValidationSync('test value', {}, 'Test Rule');
    expect(unit.valid).toBeFalsy();
    expect(unit.messages).toEqual([defaultRule.failureMessage]);
  });

  it('will pass when all rules pass', () => {
    unit.rules = [
      {
        validationFunction: (): boolean => true,
        failureMessage: 'fake message',
        name: 'Test Passing Rule',
        discrete: true,
        isAsync: false
      }
    ];
    unit.runValidationSync('test value', {}, 'Test Rule');
    expect(unit.valid).toBeTruthy();
    expect(unit.messages).toEqual([]);
  });
});
