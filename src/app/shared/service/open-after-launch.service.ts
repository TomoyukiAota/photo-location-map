import { inject, Service } from '@angular/core';
import { Analytics } from '../../../../src-shared/analytics/analytics';
import { bridge, OpenTarget } from '../../../../src-shared/bridge/plm-bridge';
import { Logger } from '../../../../src-shared/log/logger';
import { OpenTargetService } from './open-target.service';

@Service()
export class OpenAfterLaunchService {
  private openTargetService = inject(OpenTargetService);

  /** Opens what `--open` gave at launch, if anything. */
  public async openAfterLaunchIfNeeded() {
    // The main process reads `--open`, and finds out what the path is.
    const target = await bridge().commandLine.openTarget();
    if (target.kind === 'none') { return; }
    await this.openAfterLaunch(target);
  }

  /**
   * Opens the folder of `target`, or a file's folder and selects the file if it has a location; throws if it failed.
   */
  private async openAfterLaunch(target: Exclude<OpenTarget, { kind: 'none' }>) {
    const specifiedPath = target.path;
    Logger.info(`[Open After Launch] Opening "${specifiedPath}"`);
    Analytics.trackEvent('Open After Launch', 'Open After Launch', 'Opening Item');
    if (target.kind === 'failed') {
      throw new Error(target.message);
    } else if (target.kind === 'file' || target.kind === 'directory') {
      await this.openTargetService.open(target, 'Open After Launch');
    } else {
      Logger.error(`[Open After Launch] The specified item is neither a file nor a directory, which is unexpected.`);
      Analytics.trackEvent('Open After Launch', 'Open After Launch: Unexpected', 'Item Type: Unexpected');
    }
  }
}
