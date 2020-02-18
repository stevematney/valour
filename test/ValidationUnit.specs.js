import { expect } from './support/eventual-chai';
import ValidationUnit from '../src/ValidationUnit';
import Promise from 'promise';

describe('ValidationUnit', function() {
  let unit;
  beforeEach(function() {
    unit = new ValidationUnit();
  });

  describe('initialization', function() {
    it('creates an empty list without given generators', function() {
      expect(new ValidationUnit().rules.length).to.eql(0);
    });

    it('will take a ValidationUnit with existing rules', function() {
      const fakeUnit = new ValidationUnit();
      fakeUnit.rules = [
        {
          forced: true,
          func: () => 'hello!',
          generator: () => {},
          name: 'hello'
        },
        {
          forced: false,
          func: () => 'hola señor!',
          generator: () => {},
          name: 'hola'
        }
      ];
      expect(new ValidationUnit(fakeUnit).rules).to.deep.equal(fakeUnit.rules);
    });

    it('will take multiple units with multiple rules and reduce them to a list of rules without duplicates (other than forced funcs)', function() {
      const forcedRule = {
        forced: true,
        func: () => 'yo',
        generator: () => {}
      };
      const finalList = [
        {
          forced: false,
          func: () => 'hello!',
          generator: () => {},
          name: 'hello'
        },
        {
          forced: false,
          func: () => 'hola señor!',
          generator: () => {},
          name: 'hola'
        },
        {
          forced: false,
          func: () => 'holler!',
          generator: () => {},
          name: 'holler'
        },
        forcedRule,
        forcedRule
      ];
      const unitOne = new ValidationUnit({
        rules: [finalList[0], finalList[1], finalList[2], finalList[3]]
      });
      const unitTwo = new ValidationUnit({
        rules: [finalList[1], finalList[2], finalList[3], finalList[1]]
      });
      const finalUnit = new ValidationUnit(unitOne, unitTwo);
      expect(finalUnit.rules).to.deep.equal(finalList);
    });

    it('makes removal rules for each "is" function', function() {
      const unit = new ValidationUnit().isEmail().isMobilePhone();
      expect(unit.removeIsEmail).to.be.ok;
      expect(unit.removeIsMobilePhone).to.be.ok;
    });

    it("will set it's valid property to the existing unit's valid property", function() {
      const fakeUnit = new ValidationUnit();
      fakeUnit.valid = true;
      expect(new ValidationUnit(fakeUnit).valid).to.be.true;
    });

    it("will set it's messages to the existing unit's messages", function() {
      const fakeUnit = new ValidationUnit();
      fakeUnit.messages = ['Test Message', 'Test Message 2'];
      expect(new ValidationUnit(fakeUnit).messages).to.deep.equal(
        fakeUnit.messages
      );
    });
  });

  describe('duplicate validation requirements', function() {
    it('does not duplicate requirements', function() {
      unit = unit.isRequired().isRequired();
      expect(unit.rules.length).to.equal(1);
    });
  });

  describe('requirement chaining', function() {
    const matches = ['foo', 'bar'];
    beforeEach(function() {
      unit = unit
        .isEmail()
        .isValidatedBy(
          value => !!matches.filter(match => value.includes(match)).length,
          'Value should contain "foo" or "bar".'
        );
    });

    it('provides multiple invalid messages', function(done) {
      unit.runValidation('nope', {}, 'Email field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.contain(
          'Email field must be a valid email address.'
        );
        expect(result.messages).to.contain(
          'Value should contain "foo" or "bar".'
        );
        done();
      });
    });

    it('will fail only one rule', function(done) {
      unit.runValidation('foo', {}, 'Email field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'Email field must be a valid email address.'
        ]);
      });

      unit.runValidation('nope@email.com').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'Value should contain "foo" or "bar".'
        ]);
      });

      setTimeout(() => done(), 20);
    });
  });

  describe('non-required rules', function() {
    it('is valid if the form value is not checkable', function(done) {
      unit = unit.isEmail();
      unit.runValidation(null).then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });
  });

  describe('shouldCheckValue', function() {
    beforeEach(function() {
      unit = new ValidationUnit().isEmail();
    });

    describe('when the value is not required', function() {
      it('returns false if the current ValidationUnit value is undefined, null or zero length', function() {
        const isCheckable = unit.shouldCheckValue(undefined);
        expect(isCheckable).to.be.false;
      });

      it('returns true if the current ValidationUnit should be evaluated', function() {
        const isCheckable = unit.shouldCheckValue('working@email.com');
        expect(isCheckable).to.be.true;
      });
    });

    describe('when the value is required', function() {
      it('always returns true', function() {
        unit = new ValidationUnit().isEmail().isRequired();
        expect(unit.shouldCheckValue(null)).to.be.true;
        expect(unit.shouldCheckValue('some value')).to.be.true;
      });
    });
  });

  describe('getState', function() {
    beforeEach(function() {
      unit = new ValidationUnit().isEmail();
    });

    it('sets valid to true if the current ValidationUnit is not required, the unit has no current value, and valid has no current value', function() {
      unit.value = undefined;
      unit.valid = undefined;
      expect(unit.getState().valid).to.be.true;
    });

    it('valid keeps its current value if the unit has a current value', function() {
      unit.value = 'anycurrentvalue';

      unit.valid = undefined;
      expect(unit.getState().valid).to.be.undefined;

      unit.valid = false;
      expect(unit.getState().valid).to.be.false;

      unit.valid = true;
      expect(unit.getState().valid).to.be.true;
    });

    it('valid keeps its current value if the ValidationUnit is required and the unit has no current value', function() {
      unit = new ValidationUnit().isEmail().isRequired();
      unit.value = undefined;

      unit.valid = undefined;
      expect(unit.getState().valid).to.be.undefined;

      unit.valid = false;
      expect(unit.getState().valid).to.be.false;

      unit.valid = true;
      expect(unit.getState().valid).to.be.true;
    });
  });

  describe('isValidatedBy', function() {
    const matches = ['foo', 'bar'];
    beforeEach(function() {
      unit = unit.isValidatedBy(
        value => !!matches.filter(match => value.includes(match)).length,
        'Value should contain "foo" or "bar".'
      );
    });

    it('will pass a custom validator', function(done) {
      unit.runValidation('foo').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('will fail a custom validator', function(done) {
      unit.runValidation('blah').then(() => {
        expect(unit.getState().valid).to.be.false;
        expect(unit.getState().messages).to.deep.equal([
          'Value should contain "foo" or "bar".'
        ]);
        done();
      });
    });

    describe('checking against other values', function() {
      beforeEach(function() {
        unit = unit.isValidatedBy((value, allValues) => {
          return value === allValues.dependent;
        }, 'Value must be equal to "dependent."');
      });

      it('passes when its dependent values are correct', function(done) {
        unit.runValidation('foo', { dependent: 'foo' }).then(() => {
          expect(unit.getState().valid).to.be.true;
          done();
        });
      });

      it('fails when its dependent values are not correct', function(done) {
        unit.runValidation('foo', { dependent: 'bar' }).then(() => {
          expect(unit.getState().valid).to.be.false;
          expect(unit.getState().messages).to.deep.equal([
            'Value must be equal to "dependent."'
          ]);
          done();
        });
      });

      it('will fail with multiple validation messages', function(done) {
        unit.runValidation('doo', { dependent: 'bar' }).then(() => {
          expect(unit.getState().valid).to.be.false;
          expect(unit.getState().messages).to.deep.equal([
            'Value should contain "foo" or "bar".',
            'Value must be equal to "dependent."'
          ]);
          done();
        });
      });
    });
  });

  describe('isEventuallyValidatedBy', function() {
    let resolves = [],
      rejects = [];
    const waitForNonEmpty = setFunc =>
      new Promise(res => {
        const check = () =>
          setTimeout(() => {
            if (setFunc().length) {
              res();
              return;
            }
            check();
          }, 10);
        check();
      });
    const callResolve = () => {
      waitForNonEmpty(() => resolves).then(() => {
        rejects.shift();
        resolves.shift()();
      });
    };

    const callReject = () => {
      waitForNonEmpty(() => rejects).then(() => {
        resolves.shift();
        rejects.shift()();
      });
    };

    beforeEach(function() {
      resolves = [];
      rejects = [];
      unit = unit.isEventuallyValidatedBy((val, allValues, resolve, reject) => {
        resolves = [...resolves, resolve];
        rejects = [...rejects, reject];
      }, 'the length should be 4');
    });

    it('will eventually pass validation', function(done) {
      unit.runValidation('hola').then(() => {
        expect(unit.getState().waiting).to.be.false;
        expect(unit.getState().valid).to.be.true;
        done();
      });

      callResolve();

      expect(unit.getState().valid).to.be.undefined;
      expect(unit.getState().waiting).to.be.true;
    });

    it('will eventually fail validation', function(done) {
      unit.runValidation('hello').then(() => {
        expect(unit.getState().waiting).to.be.false;
        expect(unit.getState().valid).to.be.false;
        expect(unit.getState().messages).to.deep.equal([
          'the length should be 4'
        ]);
        done();
      });

      expect(unit.getState().valid).to.be.undefined;
      expect(unit.getState().waiting).to.be.true;
      callReject();
    });

    it('will only fail on the most recent value', function(done) {
      unit.runValidation('hello').then(() => {
        expect(unit.getState().valid).to.be.undefined;
        expect(unit.getState().waiting).to.be.true;
        callReject();
      });

      unit.runValidation('hola').then(() => {
        expect(unit.getState().waiting).to.be.false;
        expect(unit.getState().valid).to.be.false;
        done();
      });

      callResolve();
    });

    it('will only pass on the most recent value', function(done) {
      unit.runValidation('hello').then(() => {
        expect(unit.getState().valid).to.be.undefined;
        expect(unit.getState().waiting).to.be.true;
        callResolve();
      });

      unit.runValidation('hola').then(() => {
        expect(unit.getState().waiting).to.be.false;
        expect(unit.getState().valid).to.be.true;
        done();
      });

      callReject();
    });

    describe('running validation with mixed sync and async', function() {
      let hasRunAsync = false;
      beforeEach(function() {
        hasRunAsync = false;
        unit = new ValidationUnit()
          .isEmail()
          .isEventuallyValidatedBy((val, allVals, resolve) => {
            hasRunAsync = true;
            resolve();
          });
      });

      it('does not run async rules if sync rules fail', function(done) {
        unit.runValidation('hello').then(() => {
          expect(hasRunAsync).to.be.false;
          expect(unit.getState().waiting).to.be.false;
          expect(unit.getState().valid).to.be.false;
          done();
        });
      });

      it('does run async rules if sync rules pass', function(done) {
        unit.runValidation('hello@mail.com').then(() => {
          expect(hasRunAsync).to.be.true;
          expect(unit.getState().waiting).to.be.false;
          expect(unit.getState().valid).to.be.true;
          done();
        });
      });
    });
  });

  describe('isRequired', function() {
    beforeEach(function() {
      unit = unit.isRequired();
    });

    it('fails when value not present and formats message with the name', function(done) {
      unit.runValidation(null, {}, 'required input').then(() => {
        expect(unit.getState().valid).to.be.false;
        expect(unit.getState().messages).to.deep.equal([
          'required input is required.'
        ]);
        done();
      });
    });

    it('fails on empty strings', function(done) {
      unit.runValidation("I'm here!").then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('passes when value is present', function(done) {
      unit.runValidation("I'm here!").then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });
  });

  describe('isRequiredWhen', function() {
    let shouldBeRequired;

    beforeEach(function() {
      shouldBeRequired = false;
      unit = unit.isRequiredWhen(() => shouldBeRequired);
    });

    it('fails when the value is not present and it is required', function(done) {
      shouldBeRequired = true;

      unit.runValidation(null, {}, 'required input').then(() => {
        expect(unit.getState().valid).to.be.false;
        expect(unit.getState().messages).to.deep.equal([
          'required input is required.'
        ]);
        done();
      });
    });

    it('passes when the value is not present, but it is not required', function(done) {
      shouldBeRequired = false;

      unit.runValidation(null).then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails on empty strings when the value is required', function(done) {
      shouldBeRequired = true;

      unit.runValidation('').then(() => {
        expect(unit.getState().valid).to.be.false;
        done();
      });
    });

    it('passes on empty strings when the value is not required', function(done) {
      shouldBeRequired = false;

      unit.runValidation('').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('passes when value is present and it is required', function(done) {
      shouldBeRequired = true;

      unit.runValidation("I'm here!").then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('passes when value is present and it is not required', function(done) {
      shouldBeRequired = false;

      unit.runValidation("I'm here!").then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });
  });

  describe('isEmail', function() {
    beforeEach(function() {
      unit = unit.isEmail();
    });

    it('fails when value not an email address', function(done) {
      unit.runValidation('notemail', {}, 'Email field').then(() => {
        expect(unit.getState().valid).to.be.false;
        expect(unit.getState().messages).to.deep.equal([
          'Email field must be a valid email address.'
        ]);
        done();
      });
    });

    it('passes when value is an email address', function(done) {
      unit.runValidation('real@mail.com').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });
  });

  describe('contains', function() {
    beforeEach(function() {
      unit = unit.contains('foo');
    });

    it('passes when the value is contained', function(done) {
      unit.runValidation('food').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('passes when the value is not contained', function(done) {
      unit.runValidation('eat', {}, 'Foo input').then(() => {
        expect(unit.getState().valid).to.be.false;
        expect(unit.getState().messages).to.deep.equal([
          'Foo input must contain "foo."'
        ]);
        done();
      });
    });
  });

  describe('equals', function() {
    beforeEach(function() {
      unit = unit.equals('one');
    });

    it('passes when the value is equal', function(done) {
      unit.runValidation('one').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the value is not equal', function(done) {
      unit.runValidation('onex', {}, '"One" input').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          '"One" input must equal "one."'
        ]);
        done();
      });
    });
  });

  describe('equalsOther', function() {
    beforeEach(function() {
      unit = unit.equalsOther('confirmation');
    });

    it('passes when the value is equal with the given other', function(done) {
      unit
        .runValidation('yep', {
          confirmation: 'yep'
        })
        .then(() => {
          expect(unit.getState().valid).to.be.true;
          done();
        });
    });

    it('fails when the value is not equal with the given other', function(done) {
      unit
        .runValidation(
          'nope',
          {
            confirmation: 'yep'
          },
          'This guy'
        )
        .then(() => {
          const result = unit.getState();
          expect(result.valid).to.be.false;
          expect(result.messages).to.deep.equal([
            'This guy must be equal to confirmation.'
          ]);
          done();
        });
    });
  });

  describe('isAfter', function() {
    beforeEach(function() {
      unit = unit.isAfter('1/1/2014');
    });

    it('passes when the value is after the given date', function(done) {
      unit.runValidation('1/1/2015').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('passes when the given value is a date and after the given date', function(done) {
      unit.runValidation(new Date('1/1/2015')).then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value is before the given date', function(done) {
      unit.runValidation('1/1/2013', {}, 'Date input').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'Date input must be after 1/1/2014.'
        ]);
        done();
      });
    });
  });

  describe('isBefore', function() {
    beforeEach(function() {
      unit = unit.isBefore('1/1/2016');
    });

    it('passes when the value is before the given date', function(done) {
      unit.runValidation('1/1/2015').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('passes when the given value is a date and before the given date', function(done) {
      unit.runValidation(new Date('1/1/2015')).then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value is after the given date', function(done) {
      unit.runValidation('1/2/2016', {}, 'Date input').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'Date input must be before 1/1/2016.'
        ]);
        done();
      });
    });
  });

  describe('isAlpha', function() {
    beforeEach(function() {
      unit = unit.isAlpha();
    });

    it('passes when the value is only alphabetical', function(done) {
      unit.runValidation('abc').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the value is not only alphabetical', function(done) {
      unit.runValidation('abc123', {}, 'Alpha input').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'Alpha input must use only alphabetical characters.'
        ]);
        done();
      });
    });
  });

  describe('isAlphanumeric', function() {
    beforeEach(function() {
      unit = unit.isAlphanumeric();
    });

    it('passes when the unit is alphanumeric', function(done) {
      unit.runValidation('abc123').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the unit is not alphanumeric', function(done) {
      unit
        .runValidation('abc123, and you', {}, 'Alphanumeric input')
        .then(() => {
          const result = unit.getState();
          expect(result.valid).to.be.false;
          expect(result.messages).to.deep.equal([
            'Alphanumeric input must use only alphanumeric characters.'
          ]);
          done();
        });
    });
  });

  describe('isAscii', function() {
    beforeEach(function() {
      unit = unit.isAscii();
    });

    it('passes when the string contains only ascii characters.', function(done) {
      unit.runValidation('yep!').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the string has more than ascii characters', function(done) {
      unit.runValidation('nope! ӂ', {}, 'ASCII field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'ASCII field must use only ASCII characters.'
        ]);
        done();
      });
    });
  });

  describe('isBase64', function() {
    beforeEach(function() {
      unit = unit.isBase64();
    });

    it('passes when the string is base64 encoded', function(done) {
      unit.runValidation('eWVwIQ==').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the string is not base64 encoded', function(done) {
      unit.runValidation('nope!', {}, 'Base64 field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'Base64 field must be base64 encoded.'
        ]);
        done();
      });
    });
  });

  describe('isBoolean', function() {
    beforeEach(function() {
      unit = unit.isBoolean();
    });

    it('passes when the string is base64 encoded', function(done) {
      unit.runValidation('true').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('passes when given a true boolean value', function(done) {
      unit.runValidation(true).then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('passes when given a false boolean value', function(done) {
      unit.runValidation(false).then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the string is not base64 encoded', function(done) {
      unit.runValidation('nope!', {}, 'Boolean field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'Boolean field must be a boolean value.'
        ]);
        done();
      });
    });
  });

  describe('isByteLength', function() {
    beforeEach(function() {
      unit = unit.isByteLength(3);
    });

    it('passes when the string is the correct byte length', function(done) {
      unit.runValidation('foo').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the string is the incorrect byte length', function(done) {
      unit.runValidation('o', {}, 'Bytelength field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'Bytelength field must have a minimum byte length of 3.'
        ]);
        done();
      });
    });
  });

  describe('isCreditCard', function() {
    beforeEach(function() {
      unit = unit.isCreditCard();
    });

    it('passes when the number is a credit card', function(done) {
      unit.runValidation('4024007171444473').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('passes when the number is a credit card with spaces', function(done) {
      unit.runValidation('4024 0071 7144 4473').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('passes when the number is a credit card with dashes', function(done) {
      unit.runValidation('4024-0071-7144-4473').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the number is not a credit card number', function(done) {
      unit.runValidation('4024-0071-7144-473', {}, 'CC field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'CC field must be a credit card number.'
        ]);
        done();
      });
    });
  });

  describe('isCurrency', function() {
    beforeEach(function() {
      unit = unit.isCurrency({
        symbol: '€',
        require_symbol: true,
        include_extra_info: false
      });
    });

    it('passes when the value is currency in the proper format', function(done) {
      unit.runValidation('€1,000').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    describe('the failure message', function() {
      it('fails with a correct validation message, symbol first by default, when required', function(done) {
        unit.runValidation('$100', {}, 'Currency field').then(() => {
          const result = unit.getState();
          expect(result.valid).to.be.false;
          expect(result.messages).to.deep.equal([
            'Currency field must be in the format "€1,000.00".'
          ]);
          done();
        });
      });

      it('fails with a correct validation message, symbol after when configured that way and required', function(done) {
        unit = new ValidationUnit().isCurrency({
          symbol: '€',
          require_symbol: true,
          symbol_after_digits: true,
          include_extra_info: false
        });
        unit.runValidation('$100', {}, 'Currency field').then(() => {
          const result = unit.getState();
          expect(result.valid).to.be.false;
          expect(result.messages).to.deep.equal([
            'Currency field must be in the format "1,000.00€".'
          ]);
          done();
        });
      });

      it('fails with a correct validation message when the symbol is not required', function(done) {
        unit = new ValidationUnit().isCurrency({
          symbol: '€'
        });
        unit.runValidation('$100', {}, 'Currency field').then(() => {
          const result = unit.getState();
          expect(result.valid).to.be.false;
          expect(result.messages).to.deep.equal([
            'Currency field must be in the format "1,000.00". (Currency symbol (€) not required.)'
          ]);
          done();
        });
      });

      it('formats the default extra info depending on whether the symbol is required', function(done) {
        unit = new ValidationUnit().isCurrency({
          symbol: '€',
          require_symbol: true
        });
        unit.runValidation('$100', {}, 'Currency field').then(() => {
          const result = unit.getState();
          expect(result.valid).to.be.false;
          expect(result.messages).to.deep.equal([
            'Currency field must be in the format "€1,000.00". (Currency symbol (€) is required.)'
          ]);
          done();
        });
      });
    });
  });

  describe('isDate', function() {
    beforeEach(function() {
      unit = unit.isDate();
    });

    it('passes when the given value is a date', function(done) {
      unit.runValidation('1/1/2015').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value is not a date', function(done) {
      unit.runValidation('not a date', {}, 'Date field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal(['Date field must be a date.']);
        done();
      });
    });
  });

  describe('isDecimal', function() {
    beforeEach(function() {
      unit = unit.isDecimal();
    });

    it('passes when the given value is a decimal number', function(done) {
      unit.runValidation('1.01').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value is not a decimal number', function(done) {
      unit.runValidation('Hola', {}, 'Decimal field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'Decimal field must represent a decimal number.'
        ]);
        done();
      });
    });
  });

  describe('isDivisibleBy', function() {
    beforeEach(function() {
      unit = unit.isDivisibleBy(2);
    });

    it('passes when the given value a divisble by the number', function(done) {
      unit.runValidation('4').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value is not divisble by the number', function(done) {
      unit.runValidation('3', {}, 'Divisible field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'Divisible field must be divisible by 2.'
        ]);
        done();
      });
    });
  });

  describe('isFQDN', function() {
    beforeEach(function() {
      unit = unit.isFQDN();
    });

    it('passes when the given value is a fully qualified domain name', function(done) {
      unit.runValidation('www.domain.com').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value is not an FQDN', function(done) {
      unit.runValidation('nope', {}, 'Domain name field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'Domain name field must be a fully qualified domain name.'
        ]);
        done();
      });
    });
  });

  describe('isFloat', function() {
    beforeEach(function() {
      unit = unit.isFloat();
    });

    it('passes when the given value is a float', function(done) {
      unit.runValidation('1.01').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value is not a float', function(done) {
      unit.runValidation('nope', {}, 'Float field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal(['Float field must be a float.']);
        done();
      });
    });
  });

  describe('isFullWidth', function() {
    beforeEach(function() {
      unit = unit.isFullWidth();
    });

    it('passes when the given value contains any full width characters', function(done) {
      unit.runValidation('Ｙｅｓ').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value does not contain full width characters', function(done) {
      unit.runValidation('nope', {}, 'Fullwidth field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'Fullwidth field must contain fullwidth characters.'
        ]);
        done();
      });
    });
  });

  describe('isHalfWidth', function() {
    beforeEach(function() {
      unit = unit.isHalfWidth();
    });

    it('passes when the given value contains any halfwidth characters', function(done) {
      unit.runValidation('yes').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value does not contain halfwidth characters', function(done) {
      unit.runValidation('Ｎｏｐｅ', {}, 'Halfwidth field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'Halfwidth field must contain halfwidth characters.'
        ]);
        done();
      });
    });
  });

  describe('isVariableWidth', function() {
    beforeEach(function() {
      unit = unit.isVariableWidth();
    });

    it('passes when the given value contains both halfwidth and fullwidth characters', function(done) {
      unit.runValidation('yes and Ｙｅｓ').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value does not contain halfwidth characters', function(done) {
      unit.runValidation('Ｎｏｐｅ', {}, 'Variable width field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'Variable width field must contain fullwidth and halfwidth characters.'
        ]);
        done();
      });
    });

    it('fails when the given value does not contain fullwidth characters', function(done) {
      unit.runValidation('nope', {}, 'Variable width field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'Variable width field must contain fullwidth and halfwidth characters.'
        ]);
        done();
      });
    });
  });

  describe('isHexColor', function() {
    beforeEach(function() {
      unit = unit.isHexColor();
    });

    it('passes when the given value is a hexadecimal color', function(done) {
      unit.runValidation('#fff').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value is not a hex color', function(done) {
      unit.runValidation('nope', {}, 'Hex Color field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'Hex Color field must be a hex color.'
        ]);
        done();
      });
    });
  });

  describe('isHexadecimal', function() {
    beforeEach(function() {
      unit = unit.isHexadecimal();
    });

    it('passes when the given value is a hexadecimal number', function(done) {
      unit.runValidation('fff0abab').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value is not a hex number', function(done) {
      unit.runValidation('hihihi', {}, 'Hexadecimal field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'Hexadecimal field must be a hexadecimal number.'
        ]);
        done();
      });
    });
  });

  describe('isIP', function() {
    beforeEach(function() {
      unit = unit.isIP();
    });

    it('passes when the given value is an IP address', function(done) {
      unit.runValidation('10.0.0.1').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value is not an IP address', function(done) {
      unit.runValidation('nope', {}, 'IP field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'IP field must be an IP address.'
        ]);
        done();
      });
    });
  });

  describe('isISBN', function() {
    beforeEach(function() {
      unit = unit.isISBN();
    });

    it('passes when the given value is an ISBN', function(done) {
      unit.runValidation('978-0765350381').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value is not an ISBN', function(done) {
      unit.runValidation('nope', {}, 'ISBN field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal(['ISBN field must be an ISBN.']);
        done();
      });
    });
  });

  describe('isISIN', function() {
    beforeEach(function() {
      unit = unit.isISIN();
    });

    it('passes when the given value is an ISIN', function(done) {
      unit.runValidation('US0378331005').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value is not an ISIN', function(done) {
      unit.runValidation('nope', {}, 'ISIN field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal(['ISIN field must be an ISIN.']);
        done();
      });
    });
  });

  describe('isISO8601', function() {
    beforeEach(function() {
      unit = unit.isISO8601();
    });

    it('passes when the given value is an ISO6801 date', function(done) {
      unit.runValidation('2015-10-11').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value is not an ISO6801', function(done) {
      unit.runValidation('nope', {}, 'ISO6801 field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'ISO6801 field must be an ISO6801 date.'
        ]);
        done();
      });
    });
  });

  describe('isIn', function() {
    beforeEach(function() {
      unit = unit.isIn(['1', '2', '3', '4', '5']);
    });

    it('passes when the given value is in the given list', function(done) {
      unit.runValidation('1').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value is not in the given list', function(done) {
      unit.runValidation('nope', {}, 'Listed field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'Listed field must be contained in ["1","2","3","4","5"].'
        ]);
        done();
      });
    });
  });

  describe('isInt', function() {
    beforeEach(function() {
      unit = unit.isInt();
    });

    it('passes when the given value is an integer', function(done) {
      unit.runValidation('1').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value is not an integer', function(done) {
      unit.runValidation('1.01', {}, 'Integer field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'Integer field must be an integer.'
        ]);
        done();
      });
    });
  });

  describe('isJSON', function() {
    beforeEach(function() {
      unit = unit.isJSON();
    });

    it('passes when the given value is JSON', function(done) {
      unit.runValidation('{"number": 1}').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value is not an integer', function(done) {
      unit.runValidation('nope', {}, 'JSON field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal(['JSON field must be JSON.']);
        done();
      });
    });
  });

  describe('isLength', function() {
    beforeEach(function() {
      unit = unit.isLength(4);
    });

    it('passes when the given value is at least the given length', function(done) {
      unit.runValidation('four').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value is not at lest the given length', function(done) {
      unit.runValidation('no', {}, 'Length field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'Length field must be at least 4 characters.'
        ]);
        done();
      });
    });
  });

  describe('isLowercase', function() {
    beforeEach(function() {
      unit = unit.isLowercase();
    });

    it('passes when the given value is lowercase', function(done) {
      unit.runValidation('lowercase').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value is not lowercase', function(done) {
      unit.runValidation('NOPE', {}, 'Lowercase field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'Lowercase field must be lowercase.'
        ]);
        done();
      });
    });
  });

  describe('isUppercase', function() {
    beforeEach(function() {
      unit = unit.isUppercase();
    });

    it('passes when the given value is uppercase', function(done) {
      unit.runValidation('UPPERCASE').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value is not lowercase', function(done) {
      unit.runValidation('nope', {}, 'Uppercase field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'Uppercase field must be uppercase.'
        ]);
        done();
      });
    });
  });

  describe('isMobilePhone', function() {
    beforeEach(function() {
      unit = unit.isMobilePhone();
    });

    it('passes when the given value is a phone number', function(done) {
      unit.runValidation('8018858458').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value is not a phone number', function(done) {
      unit.runValidation('nope', {}, 'Phone number field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'Phone number field must be a phone number.'
        ]);
        done();
      });
    });
  });

  describe('isMongoId', function() {
    beforeEach(function() {
      unit = unit.isMongoId();
    });

    it('passes when the given value is a mongo id', function(done) {
      unit.runValidation('507f1f77bcf86cd799439011').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value is not a mongo id', function(done) {
      unit.runValidation('nope', {}, 'Mongo id field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'Mongo id field must be a MongoDB id.'
        ]);
        done();
      });
    });
  });

  describe('isMultibyte', function() {
    beforeEach(function() {
      unit = unit.isMultibyte();
    });

    it('passes when the given value contains multibyte characters', function(done) {
      unit.runValidation('𝌆').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value does not contain multibyte characters', function(done) {
      unit.runValidation(' ', {}, 'Multibyte field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'Multibyte field must contain multibyte characters.'
        ]);
        done();
      });
    });
  });

  describe('isNumeric', function() {
    beforeEach(function() {
      unit = unit.isNumeric();
    });

    it('passes when the given value is numeric', function(done) {
      unit.runValidation('1234').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value is not numeric', function(done) {
      unit.runValidation('nope', {}, 'Numeric field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'Numeric field must be numeric.'
        ]);
        done();
      });
    });
  });

  describe('isSurrogatePair', function() {
    beforeEach(function() {
      unit = unit.isSurrogatePair();
    });

    it('passes when the given value is a surrogate pair', function(done) {
      unit.runValidation('\uD800\uDC00').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value is not a surrogate pair', function(done) {
      unit.runValidation('nope', {}, 'Surrogate pair field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'Surrogate pair field must be a surrogate pair.'
        ]);
        done();
      });
    });
  });

  describe('isUrl', function() {
    beforeEach(function() {
      unit = unit.isURL();
    });

    it('passes when the given value is a url', function(done) {
      unit.runValidation('http://yes.it/is').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value is not a url', function(done) {
      unit.runValidation('nope', {}, 'Url field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal(['Url field must be a url.']);
        done();
      });
    });
  });

  describe('isUUID', function() {
    beforeEach(function() {
      unit = unit.isUUID();
    });

    it('passes when the given value is a UUID', function(done) {
      unit.runValidation('de305d54-75b4-431b-adb2-eb6b9e546014').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value is not a UUID', function(done) {
      unit.runValidation('nope', {}, 'UUID field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal(['UUID field must be a UUID.']);
        done();
      });
    });
  });

  describe('matches', function() {
    beforeEach(function() {
      unit = unit.matches(/^Yes$/);
    });
    it('passes when the value given matches', function(done) {
      unit.runValidation('Yes').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value does not match', function(done) {
      unit.runValidation('nope', {}, 'Yes field').then(() => {
        const result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([
          'Yes field must match /^Yes$/.'
        ]);
        done();
      });
    });
  });

  describe('hasIsRequired', function() {
    it('returns true when the unit is required', function() {
      unit = unit.isRequired();
      expect(unit.hasIsRequired()).to.be.true;
    });

    it('returns false when the unit is not required', function() {
      expect(unit.hasIsRequired()).to.be.false;
    });
  });

  describe('remove', function() {
    it('removes a rule', function() {
      unit = unit.isEmail();
      unit.remove('isEmail');
      expect(unit.rules.length).to.equal(0);
    });
  });

  describe('setState', function() {
    it('can set the valid property on the unit', function() {
      expect(unit.valid).to.be.undefined;
      unit.setState(true);
      expect(unit.valid).to.be.true;
    });

    it("sets the valid property on the unit to true if the passed in 'valid' parameter is truthy", function() {
      expect(unit.valid).to.be.undefined;
      unit.setState({});
      expect(unit.valid).to.be.true;
      unit.setState('aaa');
      expect(unit.valid).to.be.true;
    });

    it("sets the valid property on the unit to false if the passed in 'valid' parameter is falsey", function() {
      expect(unit.valid).to.be.undefined;
      unit.setState(null);
      expect(unit.valid).to.be.false;
      unit.setState('');
      expect(unit.valid).to.be.false;
    });

    it("sets the messages property on the unit to the passed in 'messages' parameter", function() {
      const emptyArray = [];
      expect(unit.messages).to.be.undefined;
      unit.setState(null, null);
      expect(unit.messages).to.be.null;
      unit.setState(null, emptyArray);
      expect(unit.messages).to.equal(emptyArray);
    });
  });
});
