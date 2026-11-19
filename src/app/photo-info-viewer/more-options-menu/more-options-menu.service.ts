import { Service, signal } from '@angular/core';
import { MatMenuPanel } from '@angular/material/menu';

/**
 * The menu that every photo's More Options button opens, which MoreOptionsMenuComponent makes once in the home view.
 * TL;DR: One menu for all the photos, which the button gives its photo when it opens it.
 * Details: The button is in every row of the folder tree, in each popup of the map and in the photo shown beside the
 * tiles of a cluster's popup, and PhotoInfoViewerComponent is kept light (see its comment): a menu in each, with its
 * submenus, would be three components of Angular Material in every row. The map makes its popups outside any
 * template, so the menu reaches their buttons through this service rather than through a template.
 */
@Service()
export class MoreOptionsMenuService {
  /** The menu, once the home view has made it; null before, when a button opens nothing. */
  public readonly menu = signal<MatMenuPanel | null>(null);
}
