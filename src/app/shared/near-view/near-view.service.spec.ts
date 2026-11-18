import { TestBed } from '@angular/core/testing';
import { NearViewService } from './near-view.service';

/** An IntersectionObserver, which jsdom has none of: the test reports which elements intersect. */
class ObserverDouble {
  public static readonly made: ObserverDouble[] = [];
  public readonly observed = new Set<Element>();

  constructor(private readonly callback: IntersectionObserverCallback, public readonly options: IntersectionObserverInit) {
    ObserverDouble.made.push(this);
  }

  public observe(element: Element): void {
    this.observed.add(element);
  }

  public unobserve(element: Element): void {
    this.observed.delete(element);
  }

  public disconnect(): void {
    this.observed.clear();
  }

  /** Reports each element as near or not, as the page does after a layout that changed it. */
  public report(...changes: [Element, boolean][]): void {
    const entries = changes.map(([target, isIntersecting]) => ({ target, isIntersecting }) as IntersectionObserverEntry);
    this.callback(entries, this as unknown as IntersectionObserver);
  }
}

describe('NearViewService', () => {
  let service: NearViewService;

  beforeEach(() => {
    ObserverDouble.made.length = 0;
    vi.stubGlobal('IntersectionObserver', ObserverDouble);
    service = TestBed.inject(NearViewService);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('watches every element with one observer, with the same margin around the window and around the boxes that scroll', () => {
    service.watch(document.createElement('div'), () => undefined);
    service.watch(document.createElement('div'), () => undefined);

    expect(ObserverDouble.made).toHaveLength(1);
    expect(ObserverDouble.made[0].options).toEqual({ rootMargin: '1250px', scrollMargin: '1250px' });
    expect(ObserverDouble.made[0].observed.size).toBe(2);
  });

  it('tells once that an element has come near, and stops watching it then', () => {
    const [near, far] = [document.createElement('div'), document.createElement('div')];
    const told: string[] = [];
    service.watch(near, () => told.push('near'));
    service.watch(far, () => told.push('far'));
    const observer = ObserverDouble.made[0];

    observer.report([near, true], [far, false]);

    expect(told).toEqual(['near']);
    expect([...observer.observed]).toEqual([far]);
    // A report that the observer had made before it stopped watching the element.
    observer.report([near, true]);
    expect(told).toEqual(['near']);
  });

  it('stops watching an element that goes before it has come near', () => {
    const element = document.createElement('div');
    const whenNear = vi.fn();
    const stopWatching = service.watch(element, whenNear);
    const observer = ObserverDouble.made[0];

    stopWatching();
    observer.report([element, true]);

    expect(observer.observed.size).toBe(0);
    expect(whenNear).not.toHaveBeenCalled();
  });
});
