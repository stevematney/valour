import ValidationUnit from './ValidationUnit-new';

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
