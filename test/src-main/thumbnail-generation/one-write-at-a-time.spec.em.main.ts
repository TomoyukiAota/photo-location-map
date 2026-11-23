import assert from 'assert';
import { oneWriteAtATime } from '../../../src-main/thumbnail-generation/one-write-at-a-time.js';

describe('oneWriteAtATime (in main process)', () => {
  let events: string[];

  /** A write that records when it starts and ends, and ends when the test says so. */
  function writeOf(name: string) {
    let end: () => void;
    let fail: (error: Error) => void;
    const ended = new Promise<string>((resolve, reject) => {
      end = () => resolve(name);
      fail = reject;
    });
    return {
      write: () => {
        events.push(`${name} started`);
        return ended.finally(() => events.push(`${name} ended`));
      },
      end: () => end(),
      fail: (error: Error) => fail(error),
    };
  }

  /** Lets what waits for the writes that ended run. */
  const settle = () => new Promise(resolve => setImmediate(resolve));

  beforeEach(() => events = []);

  it('runs the writes of a thumbnail one after another, in the order that they started, and those of others at once', async () => {
    const [first, second, other] = ['first', 'second', 'other'].map(writeOf);
    const written = [
      oneWriteAtATime('/cache/IMG_0001.JPG.plm.jpg', first.write),
      oneWriteAtATime('/cache/IMG_0001.JPG.plm.jpg', second.write),
      oneWriteAtATime('/cache/IMG_0002.JPG.plm.jpg', other.write),
    ];
    await settle();
    assert.deepStrictEqual(events, ['first started', 'other started']);

    first.end();
    await settle();
    assert.deepStrictEqual(events, ['first started', 'other started', 'first ended', 'second started']);

    second.end();
    other.end();
    assert.deepStrictEqual(await Promise.all(written), ['first', 'second', 'other']);
  });

  it('runs the next write of a thumbnail when one fails, which rejects with its error', async () => {
    const [first, second] = ['first', 'second'].map(writeOf);
    const firstWritten = oneWriteAtATime('/cache/IMG_0001.JPG.plm.jpg', first.write);
    const secondWritten = oneWriteAtATime('/cache/IMG_0001.JPG.plm.jpg', second.write);
    first.fail(new Error('The disk is full.'));
    await assert.rejects(firstWritten, /The disk is full/);
    await settle();
    assert.deepStrictEqual(events, ['first started', 'first ended', 'second started']);

    second.end();
    assert.strictEqual(await secondWritten, 'second');
  });
});
