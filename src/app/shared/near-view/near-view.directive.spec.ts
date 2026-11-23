import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NearViewDirective } from './near-view.directive';
import { NearViewService } from './near-view.service';

/** A component inside the directive's element, which reads it in its own template, as the tree's rows do. */
@Component({ selector: 'app-inside', template: '{{ nearView.isNear() ? \'near\' : \'not near\' }}' })
class InsideComponent {
  protected readonly nearView = inject(NearViewDirective);
}

@Component({ template: '<p appNearView><app-inside /></p>', imports: [NearViewDirective, InsideComponent] })
class HostComponent {}

describe('NearViewDirective', () => {
  /** What to do when each element that is watched comes near, which the service would do. */
  let watched: Map<Element, (distanceFromMiddle: number) => void>;

  beforeEach(() => {
    watched = new Map();
    const service: Pick<NearViewService, 'watch'> = {
      watch: (element, whenNear) => {
        watched.set(element, whenNear);
        return () => watched.delete(element);
      },
    };
    TestBed.configureTestingModule({ providers: [{ provide: NearViewService, useValue: service }] });
  });

  it('tells the components inside its element once the element has come near what is shown', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement.querySelector('p');
    expect(element.textContent).toBe('not near');
    expect([...watched.keys()]).toEqual([element]);

    watched.get(element)(120);
    await fixture.whenStable();

    expect(element.textContent).toBe('near');
    // How far it was from the middle of the window, for the components that are made in order.
    expect(fixture.debugElement.query(By.directive(NearViewDirective)).injector.get(NearViewDirective).distanceFromMiddleWhenNear).toBe(120);
  });

  it('stops watching its element when the element goes', async () => {
    const fixture = TestBed.createComponent(HostComponent);
    await fixture.whenStable();

    fixture.destroy();

    expect(watched.size).toBe(0);
  });
});
