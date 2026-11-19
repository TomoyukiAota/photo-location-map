import { TestBed } from '@angular/core/testing';
import { DropHintComponent } from './drop-hint.component';

describe('DropHintComponent', () => {
  it('says that a drop opens the folder, under an icon that screen readers pass over', async () => {
    await TestBed.configureTestingModule({ imports: [DropHintComponent] }).compileComponents();
    const fixture = TestBed.createComponent(DropHintComponent);
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;

    expect(host.querySelector('.text').textContent).toBe('Drop to open the folder.');
    expect(host.querySelector('svg.icon').getAttribute('aria-hidden')).toBe('true');
  });
});
