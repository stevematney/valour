import { expect } from '../support/eventual-chai';
import formatValidationMessage from '../../src/util/format-validation-message';

describe('formatValidationMessage', () => {
  it('formats a name', () => {
    expect(
      formatValidationMessage('{name} is a cool guy', {
        name: 'Steve'
      })
    ).to.equal('Steve is a cool guy');
  });

  it('formats for multiple values', () => {
    expect(
      formatValidationMessage('{name} is a {noun}', {
        name: 'Steve',
        noun: 'cool guy'
      })
    ).to.equal('Steve is a cool guy');
  });
});
