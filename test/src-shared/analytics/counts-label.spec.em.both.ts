// power-assert's parser in this test setup does not accept newer syntax such as `??` or `1_000`.
import assert = require('assert');
import { countBy, countsLabel, otherKey } from '../../../src-shared/analytics/counts-label';

describe('countsLabel', () => {
  it('should list the counts as a JSON object, most common first', () => {
    const label = countsLabel(countBy(['jpg', 'heic', 'jpg', 'CR3', 'jpg', 'heic']));

    assert.equal(label, '{"jpg":3,"heic":2,"CR3":1}');
  });

  it('should give an empty object for no counts', () => {
    assert.equal(countsLabel(new Map()), '{}');
  });

  it('should add up what does not fit as "(other)", keeping the most common', () => {
    const counts = new Map<string, number>();
    for (let i = 0; i < 2000; i++)
      counts.set(`extension-${i}`, 2000 - i);

    const label = countsLabel(counts, 1000);
    const parsed: Record<string, number> = JSON.parse(label);

    assert.ok(label.length <= 1000);
    assert.equal(parsed['extension-0'], 2000);
    assert.ok(parsed[otherKey] > 0);
    const total = Object.keys(parsed).reduce((sum, key) => sum + parsed[key], 0);
    assert.equal(total, 2000 * 2001 / 2);
  });

  it('should keep names with characters that need escaping intact', () => {
    const label = countsLabel(countBy(['a"b', 'c\\d']));

    assert.deepEqual(Object.keys(JSON.parse(label)).sort(), ['a"b', 'c\\d']);
  });
});
