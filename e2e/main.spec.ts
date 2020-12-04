import { expect } from 'chai';
import { SpectronClient } from 'spectron';

import commonSetup from './common-setup';

describe('Photo Location Map', function () {
  commonSetup.apply(this);

  let client: SpectronClient;

  beforeEach(function () {
    client = this.app.client;
  });

  it('should create the main window', async function () {
    const count = await client.getWindowCount();
    expect(count).to.equal(1);
  });

  it('should display Select Folder button', async function () {
    const element = await client.$('#select-folder-button > button > span');
    const text = await element.getText();
    expect(text).to.contain('Select Folder');
  });
});
