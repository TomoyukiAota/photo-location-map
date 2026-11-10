import { ApplicationRef, ComponentRef, createComponent, EnvironmentInjector, inject, Service, Type } from '@angular/core';

/**
 * Angular components as the content of what Leaflet shows: a marker's popup, a cluster's popup, the info of the
 * regions.
 * TL;DR: Leaflet makes these elements itself and takes an element as their content, so the component of each is made
 * here, outside any template, and its element is given to Leaflet.
 * Details:
 * - A component is rendered at once, as Leaflet measures a popup's content when the popup opens, to size the popup
 *   and to pan the map so that the popup is in view.
 * - It is attached to the application, so that it is rendered again whenever what it shows changes, as a
 *   component in a template is.
 * - The components last as long as the map that shows them: the map component destroys them all when it renders the
 *   map again, which makes a new Leaflet map, and when it is destroyed itself. A popup that closes keeps its
 *   component, as Leaflet keeps the popup's content, which is shown again when the popup opens again.
 */
@Service()
export class LeafletContentService {
  private readonly applicationRef = inject(ApplicationRef);
  private readonly environmentInjector = inject(EnvironmentInjector);
  private readonly componentRefs = new Set<ComponentRef<unknown>>();

  /** Makes a component with these inputs. Its element, `location.nativeElement`, is the content for Leaflet. */
  public create<Component>(component: Type<Component>, inputs: Readonly<Record<string, unknown>>): ComponentRef<Component> {
    const componentRef = createComponent(component, { environmentInjector: this.environmentInjector });
    for (const [name, value] of Object.entries(inputs))
      componentRef.setInput(name, value);
    this.applicationRef.attachView(componentRef.hostView);
    componentRef.changeDetectorRef.detectChanges();

    this.componentRefs.add(componentRef);
    componentRef.onDestroy(() => this.componentRefs.delete(componentRef));
    return componentRef;
  }

  /** Destroys every component that create() made, with the map that showed them. */
  public destroyAll(): void {
    for (const componentRef of [...this.componentRefs])
      componentRef.destroy();
  }
}
