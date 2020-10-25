import { asyncFilter, asyncMap } from './async-util';

describe('AsyncUtil', () => {
  it('asyncMap should map objects', async () => {
    const input = ['a', 'b', 'c'];
    const appendCharacter = async (item: string) => item + '_expected';
    const expectedOutput = ['a_expected', 'b_expected', 'c_expected'];
    const actualOutput = await asyncMap(input, async item => await appendCharacter(item));
    expect(actualOutput).toEqual(expectedOutput);
  });

  it('asyncFilter should filter objects', async () => {
    const input = ['abc123', 'abc456', 'def789'];
    const includesAbc = async (item: string) => item.includes('abc');
    const expectedOutput = ['abc123', 'abc456'];
    const actualOutput = await asyncFilter(input, async item => await includesAbc(item));
    expect(actualOutput).toEqual(expectedOutput);
  });
});
