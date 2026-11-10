import { ApplicationRef, Component, input, OnDestroy, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { LeafletContentService } from './leaflet-content.service';

const destroyed: string[] = [];

@Component({
  selector: 'app-test-content',
  template: `@if (name(); as shownName) {<span class="name">{{ shownName }}</span>}<span class="clicks">{{ clicks() }}</span>`,
})
class TestContentComponent implements OnDestroy {
  public readonly name = input.required<string>();
  public readonly clicks = signal(0);

  public ngOnDestroy(): void {
    destroyed.push(this.name());
  }
}

describe('LeafletContentService', () => {
  let service: LeafletContentService;

  beforeEach(() => {
    destroyed.length = 0;
    service = TestBed.inject(LeafletContentService);
  });

  afterEach(() => service.destroyAll());

  it('makes a component that is rendered at once, with its inputs, for Leaflet to measure', () => {
    const content = service.create(TestContentComponent, { name: 'popup' });
    const element: HTMLElement = content.location.nativeElement;

    expect(element.tagName).toBe('APP-TEST-CONTENT');
    expect(element.querySelector('.name').textContent).toBe('popup');
  });

  it('renders the component again when what it shows changes, as a component in a template is', async () => {
    const content = service.create(TestContentComponent, { name: 'popup' });
    const element: HTMLElement = content.location.nativeElement;

    content.instance.clicks.set(2);
    content.setInput('name', 'another');
    await TestBed.inject(ApplicationRef).whenStable();

    expect(element.querySelector('.clicks').textContent).toBe('2');
    expect(element.querySelector('.name').textContent).toBe('another');
  });

  it('destroys every component that it made, and takes them out of the page, with the map that showed them', () => {
    const first = service.create(TestContentComponent, { name: 'first' });
    const second = service.create(TestContentComponent, { name: 'second' });
    const popup = document.createElement('div');
    popup.append(first.location.nativeElement, second.location.nativeElement);

    service.destroyAll();

    expect(destroyed).toEqual(['first', 'second']);
    expect(popup.childElementCount).toBe(0);
    // Nothing is left to destroy with the next map.
    service.destroyAll();
    expect(destroyed).toEqual(['first', 'second']);
  });

  it('forgets a component that is destroyed by itself', () => {
    const content = service.create(TestContentComponent, { name: 'alone' });

    content.destroy();
    service.destroyAll();

    expect(destroyed).toEqual(['alone']);
  });
});
