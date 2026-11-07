/**
 * Elements made when they are first asked for, and then kept: one per place and key, as an element can be in one
 * place at a time. clear() drops them all, to be made again.
 */
export class ElementCache<Place extends string, Element> {
  private elements = new Map<Place, Map<string, Element>>();

  public get(place: Place, key: string, create: () => Element): Element {
    let elementsOfPlace = this.elements.get(place);
    if (!elementsOfPlace) {
      elementsOfPlace = new Map();
      this.elements.set(place, elementsOfPlace);
    }
    let element = elementsOfPlace.get(key);
    if (element === undefined) {
      element = create();
      elementsOfPlace.set(key, element);
    }
    return element;
  }

  public clear(): void {
    this.elements = new Map();
  }
}
