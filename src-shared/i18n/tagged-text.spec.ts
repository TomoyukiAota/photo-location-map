import { splitAtTag } from './tagged-text.js';

describe('splitAtTag', () => {
  it('gives what is before, inside and after the tag', () => {
    expect(splitAtTag('Please see <pageLink>the troubleshooting page</pageLink>.', 'pageLink'))
      .toEqual({ before: 'Please see ', inside: 'the troubleshooting page', after: '.' });
  });

  it('finds the tag wherever a translation puts it', () => {
    expect(splitAtTag('<pageLink>トラブルシューティングのページ</pageLink>をご覧ください。', 'pageLink'))
      .toEqual({ before: '', inside: 'トラブルシューティングのページ', after: 'をご覧ください。' });
    expect(splitAtTag('詳しくは<pageLink>こちら</pageLink>', 'pageLink'))
      .toEqual({ before: '詳しくは', inside: 'こちら', after: '' });
  });

  it('leaves another tag where it is', () => {
    expect(splitAtTag('<a>one</a> and <b>two</b>', 'b')).toEqual({ before: '<a>one</a> and ', inside: 'two', after: '' });
  });

  it('gives the whole text as what is before, when the tag is not there or not closed', () => {
    expect(splitAtTag('No link here.', 'pageLink')).toEqual({ before: 'No link here.', inside: '', after: '' });
    expect(splitAtTag('An <pageLink>open tag.', 'pageLink')).toEqual({ before: 'An <pageLink>open tag.', inside: '', after: '' });
    expect(splitAtTag('A closing</pageLink> tag <pageLink>first.', 'pageLink'))
      .toEqual({ before: 'A closing</pageLink> tag <pageLink>first.', inside: '', after: '' });
  });
});
