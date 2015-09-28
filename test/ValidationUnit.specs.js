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
      unit.runValidation('nope').then(() => {
        let result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.contain('Not a valid email');
        expect(result.messages).to.contain('Value should contain "foo" or "bar".');
        done();
      });
    });

    it('will fail only one rule', (done) => {
      unit.runValidation('foo').then(() => {
        let result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([ 'Not a valid email' ]);
      });

      unit.runValidation('nope@email.com').then(() => {
        let result = unit.getState();
        expect(result.valid).to.be.false;
        expect(result.messages).to.deep.equal([ 'Value should contain "foo" or "bar".' ]);
      });

      setTimeout(() => done(), 20);
    });
  });

  describe('isRequired', () => {
    beforeEach(() => {
      unit.isRequired();
    })
    it('fails when value not present', (done) => {
      unit.runValidation(null, 'required input').then(() => {
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
      unit.isEmail();
    });

    it('fails when value not an email address', (done) => {
      unit.runValidation('notemail').then(() => {
        expect(unit.getState().valid).to.be.false;
        expect(unit.getState().messages).to.deep.equal(['Not a valid email']);
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

  describe('isValidatedBy', () => {
    let matches = ['foo', 'bar'];
    beforeEach(() => {
      unit.isValidatedBy((value) => !!matches.filter((match) => value.includes(match)).length,
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
  });

  describe('isEventuallyValidatedBy', () => {
    beforeEach(() => {
      unit = unit.isEventuallyValidatedBy((val, resolve, reject) => {
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
});