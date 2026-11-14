import assert from 'assert';
import { EventLimiter, droppedEventsLabel } from '../../../src-shared/analytics/event-limiter.js';

describe('EventLimiter', () => {
  it('should allow the events of a launch up to its limit, and count the rest as dropped', () => {
    const limiter = new EventLimiter('Test Limit', 3, 10);

    const allowed = ['a', 'b', 'c', 'd', 'e'].map(label => limiter.allows(label));

    assert.deepEqual(allowed, [true, true, true, false, false]);
    assert.equal(limiter.dropped, 2);
    assert.equal(limiter.isFull, true);
  });

  it('should allow the same label fewer times', () => {
    const limiter = new EventLimiter('Test Same Label', 20, 3);

    const allowed = ['x', 'x', 'x', 'x', 'y'].map(label => limiter.allows(label));

    assert.deepEqual(allowed, [true, true, true, false, true]);
    assert.equal(limiter.dropped, 1);
    assert.equal(limiter.isFull, false);
  });

  it('should count an event dropped without its label', () => {
    const limiter = new EventLimiter('Test Drop', 1, 1);
    limiter.drop();

    assert.equal(limiter.dropped, 1);
  });

  it('should name each kind that dropped events, with its count, and none that did not', () => {
    const label = droppedEventsLabel();

    assert.ok(label.includes('Test Limit: 2'), label);
    assert.ok(label.includes('Test Same Label: 1'), label);
    assert.ok(label.includes('Test Drop: 1'), label);
  });
});
