import {expect} from "./support/eventual-chai";
import ValidationUnit from "../src/ValidationUnit";

describe('ValidationUnit', () => {
  let unit;
  beforeEach(() => {
    unit = new ValidationUnit();
  })

  describe('initialization', () => {
    it('creates an empty list without given generators', () => {
      expect((new ValidationUnit()).rules.length).to.eql(0);
    });

    it('will take a ValidationUnit with existing rules', () => {
      let fakeUnit = new ValidationUnit();
      fakeUnit.rules = [
        {forced: true, func: () => 'hello!', generator: () => {}},
        {forced: false, func: () => 'hola señor!', generator: () => {}}
      ];
      expect(new ValidationUnit(fakeUnit).rules).to.deep.equal(fakeUnit.rules);
    });

    it('will take multiple units with multiple rules and reduce them to a list of rules without duplicates (other than forced funcs)', () => {
      let forcedRule = {forced: true, func: () => 'yo', generator: () => {}};
      let finalList = [
        {forced: false, func: () => 'hello!', generator: () => {}},
        {forced: false, func: () => 'hola señor!', generator: () => {}},
        {forced: false, func: () => 'holler!', generator: () => {}},
        forcedRule,
        forcedRule
      ];
      let unitOne = new ValidationUnit({ rules: [finalList[0], finalList[1], finalList[2], finalList[3]] });
      let unitTwo = new ValidationUnit({ rules: [finalList[1], finalList[2], finalList[3], finalList[1]] });
      let finalUnit = new ValidationUnit(unitOne, unitTwo);
      expect(finalUnit.rules).to.deep.equal(finalList);
    });
  });

  describe('duplicate validation requirements', () => {
    it('does not duplicate requirements', () => {
      unit = unit.isRequired().isRequired();
      expect(unit.rules.length).to.equal(1);
    });
  });

  describe('requirement chaining', () => {
    let matches = ['foo', 'bar'];
    beforeEach(() => {
      unit = unit.isEmail()
          .isValidatedBy((value) => !!matches.filter((match) => value.includes(match)).length,
                         'Value should contain "foo" or "bar".');
    });

    it('provides multiple invalid messages', (done) => {
      unit.runValidation('nope', {}, 'Email field').then(() => {
        let result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.contain('Email field must be a valid email address.');
        expect(result.messages).to.contain('Value should contain "foo" or "bar".');
        done();
      });
    });

    it('will fail only one rule', (done) => {
      unit.runValidation('foo', {}, 'Email field').then(() => {
        let result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([ 'Email field must be a valid email address.' ]);
      });

      unit.runValidation('nope@email.com').then(() => {
        let result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([ 'Value should contain "foo" or "bar".' ]);
      });

      setTimeout(() => done(), 20);
    });
  });

  describe('isValidatedBy', () => {
    let matches = ['foo', 'bar'];
    beforeEach(() => {
      unit = unit.isValidatedBy((value) => !!matches.filter((match) => value.includes(match)).length,
                         'Value should contain "foo" or "bar".')
    });

    it('will pass a custom validator', (done) => {
      unit.runValidation('foo').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('will fail a custom validator', (done) => {
      unit.runValidation('blah').then(() => {
        expect(unit.getState().valid).to.be.false;
        expect(unit.getState().messages).to.deep.equal(['Value should contain "foo" or "bar".']);
        done();
      });
    });

    describe('checking against other values', () => {
      beforeEach(() => {
        unit = unit.isValidatedBy((value, allValues) => {
          console.log(value, allValues);
          return value === allValues.dependent
        }, 'Value must be equal to "dependent."');
      })

      it('passes when its dependent values are correct', (done) => {
        unit.runValidation('foo', { dependent: 'foo' }).then(() => {
          expect(unit.getState().valid).to.be.true;
          done();
        });
      });

      it('fails when its dependent values are not correct', (done) => {
        unit.runValidation('foo', { dependent: 'bar' }).then(() => {
          expect(unit.getState().valid).to.be.false;
          expect(unit.getState().messages).to.deep.equal(['Value must be equal to "dependent."']);
          done();
        });
      });

      it('will fail with multiple validation messages', (done) => {
        unit.runValidation('doo', { dependent: 'bar' }).then(() => {
          expect(unit.getState().valid).to.be.false;
          expect(unit.getState().messages).to.deep.equal(['Value should contain "foo" or "bar".', 'Value must be equal to "dependent."']);
          done();
        });
      })
    })
  });

  describe('isEventuallyValidatedBy', () => {
    beforeEach(() => {
      unit = unit.isEventuallyValidatedBy((val, allValues, resolve, reject) => {
        setTimeout(() => (val.length === 4) ? resolve() : reject(), 20);
      }, 'the length should be 4');
    });

    it('will eventually pass validation', (done) => {
      unit.runValidation('hola').then(() => {
        expect(unit.getState().waiting).to.be.false;
        expect(unit.getState().valid).to.be.true;
        done();
      });

      expect(unit.getState().waiting).to.be.true;
    });

    it('will eventually fail validation', (done) => {
      unit.runValidation('hello').then(() => {
        expect(unit.getState().waiting).to.be.false;
        expect(unit.getState().valid).to.be.false;
        expect(unit.getState().messages).to.deep.equal(['the length should be 4']);
        done();
      });

      expect(unit.getState().waiting).to.be.true;
    });
  });

  describe('isRequired', () => {
    beforeEach(() => {
      unit = unit.isRequired();
    })

    it('fails when value not present and formats message with the name', (done) => {
      unit.runValidation(null, {}, 'required input').then(() => {
        expect(unit.getState().valid).to.be.false;
        expect(unit.getState().messages).to.deep.equal(['required input is required.']);
        done();
      });
    });

    it('fails on empty strings', (done) => {
      unit.runValidation('I\'m here!').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    })

    it('passes when value is present', (done) => {
      unit.runValidation('I\'m here!').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });
  });

  describe('isEmail', () => {
    beforeEach(() => {
      unit = unit.isEmail();
    });

    it('fails when value not an email address', (done) => {
      unit.runValidation('notemail', {}, 'Email field').then(() => {
        expect(unit.getState().valid).to.be.false;
        expect(unit.getState().messages).to.deep.equal(['Email field must be a valid email address.']);
        done();
      });
    });

    it('passes when value is an email address', (done) => {
      unit.runValidation('real@mail.com').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });
  });

  describe('contains', () => {
    beforeEach(() => {
      unit = unit.contains('foo');
    });

    it('passes when the value is contained', (done) => {
      unit.runValidation('food').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('passes when the value is not contained', (done) => {
      unit.runValidation('eat', {}, 'Foo input').then(() => {
        expect(unit.getState().valid).to.be.false
        expect(unit.getState().messages).to.deep.equal(['Foo input must contain "foo."']);
        done();
      })
    });
  });

  describe('equals', () => {
    beforeEach(() => {
      unit = unit.equals('one');
    });

    it('passes when the value is equal', (done) => {
      unit.runValidation('one').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the value is not equal', (done) => {
      unit.runValidation('onex', {}, '"One" input').then(() => {
        let result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([ '"One" input must equal "one."' ]);
        done();
      });
    });
  });

  describe('equalsOther', () => {
    beforeEach(() => {
      unit = unit.equalsOther('confirmation');
    });

    it('passes when the value is equal with the given other', (done) => {
      unit.runValidation('yep', {
        confirmation: 'yep'
      }).then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the value is not equal with the given other', (done) => {
      unit.runValidation('nope', {
        confirmation: 'yep'
      }, 'This guy').then(() => {
        let result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal(['This guy must be equal to confirmation.']);
        done();
      });
    });
  });

    describe('isAfter', () => {
    beforeEach(() => {
      unit = unit.isAfter('1/1/2014');
    })
    it('passes when the value is after the given date', (done) => {
      unit.runValidation('1/1/2015').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('passes when the given value is a date and after the given date', (done) => {
      unit.runValidation(new Date('1/1/2015')).then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value is before the given date', (done) => {
      unit.runValidation('1/1/2013', {}, 'Date input').then(() => {
        let result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal(['Date input must be after 1/1/2014.']);
        done();
      });
    });
  });

  describe('isBefore', () => {
    beforeEach(() => {
      unit = unit.isBefore('1/1/2016');
    })
    it('passes when the value is before the given date', (done) => {
      unit.runValidation('1/1/2015').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('passes when the given value is a date and before the given date', (done) => {
      unit.runValidation(new Date('1/1/2015')).then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the given value is after the given date', (done) => {
      unit.runValidation('1/2/2016', {}, 'Date input').then(() => {
        let result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal(['Date input must be before 1/1/2016.']);
        done();
      });
    });
  });

  describe('isAlpha', () => {
    beforeEach(() => {
      unit = unit.isAlpha();
    });

    it('passes when the value is only alphabetical', (done) => {
      unit.runValidation('abc').then(() => {
        expect(unit.getState().valid).to.be.true;
        done()
      });
    });

    it('fails when the value is not only alphabetical', (done) => {
      unit.runValidation('abc123', {}, 'Alpha input').then(() => {
        let result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal(['Alpha input must use only alphabetical characters.']);
        done();
      });
    });
  });

  describe('isAlphanumeric', () => {
    beforeEach(() => {
      unit = unit.isAlphanumeric();
    });

    it('passes when the unit is alphanumeric', (done) => {
      unit.runValidation('abc123').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the unit is not alphanumeric', (done) => {
      unit.runValidation('abc123, and you', {}, 'Alphanumeric input').then(() => {
        let result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal(['Alphanumeric input must use only alphanumeric characters.']);
        done();
      });
    });
  });

  describe('isAscii', () => {
    beforeEach(() => {
      unit = unit.isAscii();
    });

    it('passes when the string contains only ascii characters.', (done) => {
      unit.runValidation('yep!').then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the string has more than ascii characters', (done) => {
      unit.runValidation('nope! ӂ', {}, 'ASCII field').then(() => {
        let result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([ 'ASCII field must use only ASCII characters.' ]);
        done();
      });
    });
  });

  describe('isBase64', () => {
    beforeEach(() => {
      unit = unit.isBase64();
    });

    it('passes when the string is base64 encoded', (done) => {
      unit.runValidation('eWVwIQ==').then(() => {
        expect(unit.getState().valid).to.be.true;
        done()
      });
    });

    it('fails when the string is not base64 encoded', (done) => {
      unit.runValidation('nope!', {}, 'Base64 field').then(() => {
        let result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([ 'Base64 field must be base64 encoded.' ]);
        done();
      });
    });
  });

  describe('isBoolean', () => {
    beforeEach(() => {
      unit = unit.isBoolean();
    });

    it('passes when the string is base64 encoded', (done) => {
      unit.runValidation('true').then(() => {
        expect(unit.getState().valid).to.be.true;
        done()
      });
    });

    it('passes when given a true boolean value', (done) => {
      unit.runValidation(true).then(() => {
        expect(unit.getState().valid).to.be.true;
        done()
      });
    });

    it('passes when given a false boolean value', (done) => {
      unit.runValidation(false).then(() => {
        expect(unit.getState().valid).to.be.true;
        done();
      });
    });

    it('fails when the string is not base64 encoded', (done) => {
      unit.runValidation('nope!', {}, 'Boolean field').then(() => {
        let result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([ 'Boolean field must be a boolean value.' ]);
        done();
      });
    });
  });
});
