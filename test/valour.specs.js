import { expect } from 'chai';
import valour from '../src/valour';

describe('validation', function() {
  afterEach(function() {
    valour.forms = {};
    valour.callbacks = {};
  });

  describe('rule', function() {
    it('returns a ValidationUnit', function() {
      expect(valour.rule.isEmail()).not.to.be.null;
    });
  });

  describe('onUpdated', function() {
    it('adds a callback to be called when a form is updated', function() {
      let validatedFunc = () => {
        let validated = 'we did it!';
        return validated;
      };
      valour.onUpdated('newForm', validatedFunc);
      expect(valour.callbacks['newForm']).to.contain(validatedFunc);
    });

    it('does not add a callback when the given callback is falsey', function() {
      valour.onUpdated('newForm', null);
      expect(valour.callbacks['newForm']).to.not.be.ok;
    });
  });

  describe('removingUpdatedFuncs', function() {
    let updatedFunc;
    beforeEach(function() {
      updatedFunc = () => {
        /*update func*/
      };
      valour.onUpdated('newform', updatedFunc);
      valour.onUpdated('newform', () => {});
    });

    describe('removeOnUpdated', function() {
      it('removes a callback', function() {
        expect(valour.callbacks['newform'].length).to.equal(2);
        valour.removeOnUpdated('newform', updatedFunc);
        expect(valour.callbacks['newform'].length).to.equal(1);
        expect(valour.callbacks['newform'].includes(updatedFunc)).to.be.false;
      });
    });

    describe('clearOnUpdated', function() {
      it('removes all callbacsk for a form', function() {
        expect(valour.callbacks['newform'].length).to.equal(2);
        valour.clearOnUpdated('newform');
        expect(valour.callbacks['newform'].length).to.equal(0);
      });
    });
  });

  describe('register', function() {
    let emailValidation, phoneValidation, formResult;

    beforeEach(function() {
      emailValidation = valour.rule.isEmail().isRequired();
      phoneValidation = valour.rule.isMobilePhone();
      valour.register(
        'newForm',
        {
          email: emailValidation,
          phone: phoneValidation
        },
        results => {
          return results;
        }
      );

      formResult = valour.getForm('newForm');
    });

    it('registers a form', function() {
      expect(formResult.email.rules.map(rule => rule.name)).to.deep.equal([
        'isEmail',
        'isRequired'
      ]);
      expect(formResult.phone.rules.map(rule => rule.name)).to.deep.equal([
        'isMobilePhone'
      ]);
    });

    it('adds a callback if given', function() {
      expect(valour.callbacks['newForm'].length).to.equal(1);
    });

    it('does not call the callback if the validation state is not initialized', function() {
      let wasCalled = false;
      valour.register(
        'otherForm',
        {
          email: emailValidation
        },
        () => {
          wasCalled = true;
        }
      );
      expect(wasCalled).to.be.false;
    });

    it('calls the callback if the validation state is initialized', function() {
      let wasCalled = false;
      valour.register(
        'otherForm',
        {
          email: emailValidation.initializeState({ valid: false })
        },
        () => {
          wasCalled = true;
        }
      );
      expect(wasCalled).to.be.true;
    });
  });

  describe('update', function() {
    let emailValidation, phoneValidation, formResult;

    beforeEach(function() {
      emailValidation = valour.rule.isEmail().isRequired();
      phoneValidation = valour.rule.isMobilePhone();
      valour.register(
        'newForm',
        {
          email: emailValidation,
          phone: phoneValidation
        },
        results => {
          return results;
        }
      );

      valour.update(
        'newForm',
        {
          email: valour.rule.matches(/\./)
        },
        res => {
          return res && true;
        }
      );

      formResult = valour.getForm('newForm');
    });

    it('registers a form', function() {
      expect(formResult.email.rules.map(rule => rule.name)).to.deep.equal([
        'isEmail',
        'isRequired',
        'matches /\\./'
      ]);
      expect(formResult.phone.rules.map(rule => rule.name)).to.deep.equal([
        'isMobilePhone'
      ]);
    });

    it('adds a callback if given', function() {
      expect(valour.callbacks['newForm'].length).to.equal(2);
    });
  });

  describe('registering callbacks', function() {
    let emailValidation,
      phoneValidation,
      requiredValidation,
      register = callback => {
        valour.register(
          'newForm',
          {
            email: emailValidation,
            phone: phoneValidation,
            required: requiredValidation
          },
          callback
        );
      };

    beforeEach(function() {
      emailValidation = valour.rule.isEmail().isRequired();
      phoneValidation = valour.rule.isMobilePhone();
      requiredValidation = valour.rule.isRequired();
    });

    describe('runValidation', function() {
      it('updates with the current validation result. Unset fields are not checked.', function(done) {
        register(result => {
          expect(result.email.valid).to.be.false;
          expect(result.phone.valid).to.be.false;
          expect(result.required.valid).to.equal(undefined);
          done();
        });

        valour.runValidation('newForm', {
          email: 'notanemail',
          phone: 'notanumber'
        });
      });

      it('does a small wait to ensure each "synchronous" callback gets in', function(done) {
        let time = new Date().getTime();
        register(() => {
          let newTime = new Date().getTime();
          expect(newTime - time).to.be.least(100);
          done();
        });

        valour.runValidation('newForm', {
          email: 'notanemail',
          phone: 'notanumber',
          required: 'it is here!'
        });
      });
    });

    describe('runValidationSync', function() {
      it('allows a result to be checked immediately after', function(done) {
        valour.register('test', { name: valour.rule.isRequired() });

        valour.runValidationSync('test', {});
        expect(valour.isValid('test')).to.be.false;

        valour.runValidationSync('test', { name: 'test' });
        expect(valour.isValid('test')).to.be.true;

        done();
      });

      it('returns false if a single validation fails in validation chain', function(done) {
        let rule = valour.rule
          .isValidatedBy(val => val.length >= 3)
          .isValidatedBy(val => val.length <= 50);
        valour.register('test', {
          name: rule
        });

        valour.runValidationSync('test', {
          name:
            'abcdefghijklmnopqrstuvwxyzabcdefghijsdfasdfsdfasdfasdfklmnopqrstuvwxyaldkjfadf'
        });
        expect(valour.isValid('test')).to.be.false;

        valour.runValidationSync('test', { name: 'Ip' });
        expect(valour.isValid('test')).to.be.false;

        valour.runValidationSync('test', { name: 'I work!' });
        expect(valour.isValid('test')).to.be.true;
        done();
      });
    });

    describe('forceValidation', function() {
      it('updates with the current validation result. Unset fields are not checked.', function(done) {
        register(result => {
          expect(result.email.valid).to.be.false;
          expect(result.phone.valid).to.be.false;
          expect(result.required.valid).to.be.false;
          done();
        });

        valour.forceValidation('newForm', {
          email: 'notanemail',
          phone: 'notanumber'
        });
      });
    });
  });

  describe('forceValidationSync', function() {
    beforeEach(function() {
      valour.register('forceValidationSyncTest', {
        name: valour.rule.isRequired()
      });
    });

    it('allows unset fields to be checked', function() {
      valour.forceValidation('forceValidationSyncTest', {});
      const results = valour.getResult('forceValidationSyncTest');

      expect(results.name.isValid).to.not.be.ok;
    });

    it('allows a result to be checked immediately after', function() {
      valour.forceValidationSync('forceValidationSyncTest', {});
      expect(valour.isValid('forceValidationSyncTest')).to.be.false;

      valour.forceValidationSync('forceValidationSyncTest', { name: 'Billy' });
      expect(valour.isValid('forceValidationSyncTest')).to.be.true;
    });
  });

  describe('isValid', function() {
    let register = callback => {
      valour.register(
        'newForm',
        {
          email: valour.rule.isEmail(),
          phone: valour.rule.isMobilePhone()
        },
        callback
      );
    };

    it('returns true when all fields are valid', function(done) {
      register(() => {
        expect(valour.isValid('newForm')).to.be.true;
        done();
      });

      valour.runValidation('newForm', {
        email: 'anemail@mail.com',
        phone: '5544554554'
      });
    });

    it('returns false when any fields are invalid', function(done) {
      register(() => {
        expect(valour.isValid('newForm')).to.be.false;
        done();
      });

      valour.runValidation('newForm', {
        email: 'notanemail',
        phone: '5544554554'
      });
    });
  });

  describe('setValidationState', function() {
    let formName = 'newForm',
      makeFormValid = () => {
        valour.setValidationState(formName, {
          email: { valid: true }
        });
      };

    beforeEach(function() {
      valour.register(formName, {
        email: valour.rule.isEmail()
      });
    });

    it('can set the validity of the form to true by setting all form values to true', function() {
      makeFormValid();
      expect(valour.isValid()).to.be.true;
    });

    it('can set the validity of the form to false by setting a form value to false', function() {
      makeFormValid();
      valour.setValidationState(formName, { email: { valid: false } });
      expect(valour.isValid(formName)).to.be.false;
    });

    it('callback is called with the new validation result', function() {
      valour.onUpdated(formName, result => {
        expect(result.email.valid).to.be.true;
      });
      valour.setValidationState(formName, { email: { valid: true } });
    });
  });

  describe('isValidationStateSet', function() {
    let formName = 'newForm';

    beforeEach(function() {
      valour.register(formName, {
        email: valour.rule.isEmail(),
        otherEmail: valour.rule.isEmail(),
        phone: valour.rule.isMobilePhone()
      });
    });

    it("returns false if none of the validation units on the form have a value for the 'valid' property", function() {
      let form = valour.getForm(formName);
      Object.keys(form).forEach(key => {
        form[key].valid = undefined;
      });
      expect(valour.isValidationStateSet(formName)).to.be.false;
    });

    it("returns true if one of the validation units on the form have a value for the 'valid' property", function() {
      let form = valour.getForm(formName);
      form[Object.keys(form)[0]].valid = true;
      expect(valour.isValidationStateSet(formName)).to.be.true;
    });

    it("returns true if all of the validation units on the form have a value for the 'valid' property", function() {
      let form = valour.getForm(formName);
      Object.keys(form).forEach(key => {
        form[key].valid = false;
      });
      expect(valour.isValidationStateSet(formName)).to.be.true;
    });
  });

  describe('disposeForm', function() {
    let formName = 'newForm';

    it('resets the form back to an empty object', function() {
      valour.register(formName, {
        email: valour.rule.isEmail()
      });

      expect(valour.getForm(formName)).to.be.ok;

      valour.disposeForm(formName);
      expect(valour.getForm(formName)).to.deep.equal({});
    });
  });

  describe('removeField', function() {
    let formName = 'newForm';

    beforeEach(function() {
      valour.register(formName, {
        email: valour.rule.isEmail(),
        phone: valour.rule.isMobilePhone()
      });
    });

    it('removes the validation key from the form', function() {
      expect(valour.getForm(formName).email).to.be.ok;

      valour.removeField(formName, 'email');
      expect(valour.getForm(formName).email).to.be.undefined;
    });

    it("does not remove keys that aren't specified", function() {
      expect(valour.getForm(formName).phone).to.be.ok;

      valour.removeField(formName, 'email');
      expect(valour.getForm(formName).phone).to.be.ok;
    });
  });
});
