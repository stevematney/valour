import {expect} from "../support/eventual-chai";
import formatMessage from "../../src/util/format-message";

describe('formatMessage', () => {
  it('formats a name', () => {
    expect(formatMessage('Steve', '{name} is a jerk')).to.equal('Steve is a jerk');
  });
});
