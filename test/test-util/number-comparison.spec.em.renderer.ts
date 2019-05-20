import assert = require('assert');
import { nearlyEqual } from './number-comparison';

describe('NumberComparison', () => {
  describe('nearlyEqual', () => {
    it('should return true for nearlyEqual(0.1 + 0.2, 0.3)', () => {
      assert(0.1 + 0.2 !== 0.3);  // 0.1 + 0.2 is 0.30000000000000004, which is not equal to 0.3
      assert(nearlyEqual(0.1 + 0.2, 0.3));
    });

    it('should take into account the specified tolerance', () => {
      assert(nearlyEqual(1.001, 1.002, 0.01));
      assert(!nearlyEqual(1.001, 1.002, 0.001));
      assert(!nearlyEqual(1.001, 1.002, 0.0001));
    });
  });
});

