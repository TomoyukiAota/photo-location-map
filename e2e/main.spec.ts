import {expect, assert} from 'chai';
import {SpectronClient} from 'spectron';

import commonSetup from './common-setup';

describe('Photo Location Map', function () {
  commonSetup.apply(this);

  let browser: WebdriverIO.Client<void>;
  let client: SpectronClient;

  beforeEach(function () {
    client = this.app.client;
    browser = client;
  });

  it('should create the main window', async function () {
    const count = await client.getWindowCount();
    expect(count).to.equal(1);
  });

  it('should display Select Folder button', async function () {
    const text = await browser.getText('#select-folder-button > button > span');
    expect(text).to.contain('Select Folder');
  });
});
