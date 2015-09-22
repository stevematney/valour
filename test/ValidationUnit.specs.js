import {expect} from "./support/eventual-chai";
import ValidationUnit from "../src/ValidationUnit";

describe('ValidationUnit', () => {
  let unit;
  beforeEach(() => {
    unit = new ValidationUnit();
  })

  describe('initialization', () => {
    it('creates an empty list without given generators', () => {
      expect((new ValidationUnit()).promiseGenerators.length).to.eql(0);
    });

    it('will take a ValidationUnit with existing generators', () => {
      let fakeGenerators = ['hello', 'hi'];
      expect((new ValidationUnit({ promiseGenerators: fakeGenerators })).promiseGenerators).to.deep.equal(fakeGenerators);
    });
  });

  describe.only('duplicate validation requirements', () => {
    it('does not duplicate requirements', () => {
      unit = unit.isRequired().isRequired();
      expect(unit.promiseGenerators.length).to.equal(1);
    });
  });

  describe('requirement chaining', () => {
    let matches = ['foo', 'bar'];
    beforeEach(() => {
      unit.isEmail()
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
      unit.runValidation(undefined).then(() => {
        expect(unit.getState().valid).to.be.false;
        expect(unit.getState().messages).to.deep.equal(['{name} is required.']);
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
      unit.isEventuallyValidatedBy((val, resolve, reject) => {
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
