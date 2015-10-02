import {expect} from "../support/eventual-chai";
import formatValidationMessage from "../../src/util/format-validation-message";

describe('formatValidationMessage', () => {
  it('formats a name', () => {
    expect(formatValidationMessage('{name} is a jerk', {
      name: 'Steve'
    })).to.equal('Steve is a jerk');
  });

  it('formats for multiple values', () => {
    expect(formatValidationMessage('{name} is a {noun}', {
      name: 'Steve',
      noun: 'jerk'
    })).to.equal('Steve is a jerk');
  });
});
