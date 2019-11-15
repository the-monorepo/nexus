import { isValidParenthesization } from './index';
import { expect } from 'chai';

describe('isValidParenthesization', () => {
  it('1', () => expect(isValidParenthesization("((()()))()")).to.equal(true));
  it('2', () => expect(isValidParenthesization(")()(")).to.equal(false));
  it('3', () => expect(isValidParenthesization("((")).to.equal(false));
})