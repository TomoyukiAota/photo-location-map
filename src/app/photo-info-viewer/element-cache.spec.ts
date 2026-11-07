import { ElementCache } from './element-cache';

describe('ElementCache', () => {
  it('makes an element only when it is asked for, and gives the same one again', () => {
    const cache = new ElementCache<'popup' | 'tile', object>();
    const create = vi.fn(() => ({}));

    expect(create).not.toHaveBeenCalled();
    const first = cache.get('popup', '/photos/a.jpg', create);
    expect(cache.get('popup', '/photos/a.jpg', create)).toBe(first);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('keeps an element of its own for each place and each key', () => {
    const cache = new ElementCache<'popup' | 'tile', object>();
    const popup = cache.get('popup', '/photos/a.jpg', () => ({}));
    const tile = cache.get('tile', '/photos/a.jpg', () => ({}));
    const other = cache.get('popup', '/photos/b.jpg', () => ({}));
    expect(new Set([popup, tile, other]).size).toBe(3);
  });

  it('makes the elements again after it is cleared', () => {
    const cache = new ElementCache<'popup', object>();
    const before = cache.get('popup', '/photos/a.jpg', () => ({}));
    cache.clear();
    expect(cache.get('popup', '/photos/a.jpg', () => ({}))).not.toBe(before);
  });
});
