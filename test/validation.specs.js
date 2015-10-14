import {expect} from 'chai';
import validation from '../src/validation';
import ValidationUnit from "../src/ValidationUnit";

describe('validation', () => {
  afterEach(() => {
    validation.forms = {};
    validation.callbacks = {};
  });

  describe('rule', () => {
    it('returns a ValidationUnit', () => {
      expect(validation.rule.isEmail()).not.to.be.null;
    });
  });

  describe('onUpdated', () => {
    it('adds a callback to be called when a form is updated', () => {
      let validatedFunc = () => {
        let validated = 'we did it!';
        return validated;
      };
      validation.onUpdated('newForm', validatedFunc);
      expect(validation.callbacks['newForm']).to.contain(validatedFunc);
    });

    it('does not add a callback when the given callback is falsey', () => {
      validation.onUpdated('newForm', null);
      expect(validation.callbacks['newForm']).to.be.falsey;
    });
  });

  describe('register', () => {
    let emailValidation,
      phoneValidation,
      formResult;

    beforeEach(() => {
      emailValidation = validation.rule.isEmail().isRequired();
      phoneValidation = validation.rule.isMobilePhone();
      validation.register('newForm', {
        email: emailValidation,
        phone: phoneValidation
      }, (results) => {
        return results;
      });

      formResult = validation.getForm('newForm');
    });
    
    it('registers a form', () => {
      expect(formResult).to.deep.equal({
        email: emailValidation,
        phone: phoneValidation
      });

      expect(formResult.email).to.deep.equal(emailValidation);
      expect(formResult.phone).to.deep.equal(phoneValidation);
    });

    it('adds a callback if given', () => {
      expect(validation.callbacks['newForm'].length).to.equal(1);
    });
  });

  describe('update', () => {
    let emailValidation,
      phoneValidation,
      postEmailValidation,
      formResult;

    beforeEach(() => {
      emailValidation = validation.rule.isEmail().isRequired();
      phoneValidation = validation.rule.isMobilePhone();
      postEmailValidation = new ValidationUnit(emailValidation).matches(/\./);
      validation.register('newForm', {
        email: emailValidation,
        phone: phoneValidation
      }, (results) => {
        return results;
      });

      validation.update('newForm', {
        email: validation.rule.matches(/\./)
      }, (res) => {
        return res && true;
      });

      formResult = validation.getForm('newForm');
    });
    
    it('registers a form', () => {
      expect(formResult).to.deep.equal({
        email: postEmailValidation,
        phone: phoneValidation
      });

      expect(formResult.email).to.deep.equal(postEmailValidation);
    });

    it('adds a callback if given', () => {
      expect(validation.callbacks['newForm'].length).to.equal(2);
    });
  });

  describe('registering callbacks', () => {
    let emailValidation,
      phoneValidation,
      requiredValidation,
      register = (callback) => {
        validation.register('newForm', {
          email: emailValidation,
          phone: phoneValidation,
          required: requiredValidation
        }, callback);
      };

    beforeEach(() => {
      emailValidation = validation.rule.isEmail().isRequired();
      phoneValidation = validation.rule.isMobilePhone();
      requiredValidation = validation.rule.isRequired();
    });

    describe('runValidation', () => {
      it('updates with the current validation result. Unset fields are not checked.', (done) => {
        register((result) => {
          expect(result.email.valid).to.be.false;
          expect(result.phone.valid).to.be.false;
          expect(result.required.valid).to.equal(undefined);
          done();
        });

        validation.runValidation('newForm', {
          email: 'notanemail',
          phone: 'notanumber'
        });
      });
    });

    describe('forceValidation', () => {
      it('updates with the current validation result. Unset fields are not checked.', (done) => {
        register((result) => {
          expect(result.email.valid).to.be.false;
          expect(result.phone.valid).to.be.false;
          expect(result.required.valid).to.be.false;
          done();
        });

        validation.forceValidation('newForm', {
          email: 'notanemail',
          phone: 'notanumber'
        });
      });
    });
  });
});
