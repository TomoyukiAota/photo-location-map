import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AboutBoxComponent } from './about-box.component';

describe('AboutBoxComponent', () => {
  let component: AboutBoxComponent;
  let fixture: ComponentFixture<AboutBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AboutBoxComponent],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AboutBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows its sentences with a link around the linked words, and opens the links in the OS browser', () => {
    const host: HTMLElement = fixture.nativeElement;
    const troubleshooting = host.querySelector('.troubleshooting-message');
    expect(troubleshooting.textContent.trim()).toBe('If you encounter issues with this application, please see the troubleshooting page.');
    expect(troubleshooting.querySelector('a').textContent).toBe('the troubleshooting page');
    const translations = host.querySelector('.translations-message');
    expect(translations.textContent.trim()).toBe('Translations into other languages are welcome: see how to translate this application.');
    expect(translations.querySelector('a').textContent).toBe('how to translate this application');

    const openExternal = vi.spyOn(window.plm.shell, 'openExternal');
    translations.querySelector('a').click();
    expect(openExternal).toHaveBeenCalledExactlyOnceWith('https://github.com/TomoyukiAota/photo-location-map/blob/main/docs/TRANSLATING.md');
  });
});
