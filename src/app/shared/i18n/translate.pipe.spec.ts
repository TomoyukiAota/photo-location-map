import { TagPartsPipe } from './tag-parts.pipe';
import { TranslatePipe } from './translate.pipe';

describe('TranslatePipe', () => {
  const pipe = new TranslatePipe();

  it('gives the text of a key', () => {
    expect(pipe.transform('sidebar.openFolder')).toBe('Open Folder');
  });

  it('puts the values in the placeholders of the text', () => {
    expect(pipe.transform('loadingFolder.progress', { loaded: 3, total: 12 })).toBe('Loaded 3 files out of 12 files.');
    expect(pipe.transform('directoryTree.openedFolder', { path: 'C:\\Photos & <Trips>' })).toBe('Opened Folder - C:\\Photos & <Trips>');
  });

  it('puts the application\'s name in a text without being given it', () => {
    expect(pipe.transform('welcome.message')).toBe('Welcome to Photo Location Map');
  });

  it('fails, in a development build, for a placeholder that got no value', () => {
    expect(() => pipe.transform('loadedFiles.loaded')).toThrow('without a value for {{count}}');
  });
});

describe('TagPartsPipe', () => {
  it('splits a translated sentence at its tag, for the template to put its link there', () => {
    expect(new TagPartsPipe().transform(new TranslatePipe().transform('appInfo.troubleshooting'), 'pageLink')).toEqual({
      before: 'If you encounter issues with this application, please see ',
      inside: 'the troubleshooting page',
      after: '.',
    });
  });
});
