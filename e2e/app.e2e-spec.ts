import { AngularElectronPage } from './app.po';
import { browser, element, by } from 'protractor';

describe('angular-electron App', () => {
  let page: AngularElectronPage;

  beforeEach(() => {
    page = new AngularElectronPage();
  });

  it('should navigate to /', () => {
    page.navigateTo('/');
  });
});
