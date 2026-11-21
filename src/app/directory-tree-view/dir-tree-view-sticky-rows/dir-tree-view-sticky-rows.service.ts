import { Service, signal } from '@angular/core';
import { currentUserSettings } from '../../../../src-shared/user-settings/user-settings';

/**
 * What the rows kept at the top of the folder tree go by (DirTreeViewStickyRowsComponent): the settings, and how much
 * of the sidebar's pane they cover, which what scrolls the pane leaves out.
 */
@Service()
export class DirTreeViewStickyRowsService {
  private readonly maximumState = signal(currentUserSettings.stickyFolderRowsMaximum);
  private readonly leftOutState = signal(currentUserSettings.stickyFolderRowsLeftOut);
  private readonly coveredHeightState = signal(0);

  /** The most rows kept at the top (src-shared/user-settings/sticky-folder-rows.ts). */
  public readonly maximum = this.maximumState.asReadonly();
  /** Which folders those rows leave out when there are more folders than rows. */
  public readonly leftOut = this.leftOutState.asReadonly();
  /**
   * How high the rows kept at the top are, from the pane's top: what the pane leaves out when it scrolls a focused row
   * into view (scroll-padding-top, HomeComponent).
   */
  public readonly coveredHeight = this.coveredHeightState.asReadonly();

  private heightAt: ((scrollTop: number) => number) | null = null;

  /**
   * How high the rows kept at the top would be with the pane scrolled to `scrollTop`: what the tree's eased scroll
   * leaves out where it stops. 0 while the tree has no rows kept at the top.
   */
  public coveredHeightAt(scrollTop: number): number {
    return this.heightAt?.(scrollTop) ?? 0;
  }

  /** Called by the rows kept at the top with how they work out their height at a scroll position, and null when they go. */
  public measureWith(heightAt: ((scrollTop: number) => number) | null): void {
    this.heightAt = heightAt;
  }

  /** Takes the settings as saved, which the Settings dialog has just done. */
  public applySettings(): void {
    this.maximumState.set(currentUserSettings.stickyFolderRowsMaximum);
    this.leftOutState.set(currentUserSettings.stickyFolderRowsLeftOut);
  }

  /** Called by the rows kept at the top whenever their height changes. */
  public cover(height: number): void {
    this.coveredHeightState.set(height);
  }
}
