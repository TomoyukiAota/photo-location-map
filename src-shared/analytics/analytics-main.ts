import * as uuid from 'uuid/v4';
import { Logger } from '../log/logger';
import { AnalyticsInterface } from './analytics-interface';
import { DevOrProd } from './dev-or-prod';
import { UserDataStorage } from '../user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../user-data-storage/user-data-stroage-path';

export class AnalyticsMain implements AnalyticsInterface {
  private readonly trackingId = 'UA-143091961-1';
  private readonly visitor: ReturnType<typeof import('universal-analytics')>;
  private userAgent: string = null;
  private devOrProd: DevOrProd = null;

  constructor() {
    const userId = this.getUserId();
    const ua = require('universal-analytics');
    this.visitor = ua(this.trackingId, userId);
    Logger.info(`Initialized Google Analytics with user ID "${userId}"`);
  }

  private getUserId(): string {
    let userId: string;

    try {
      userId = UserDataStorage.read(UserDataStoragePath.Analytics.UserId);
    } catch {
      userId = uuid();
      UserDataStorage.write(UserDataStoragePath.Analytics.UserId, userId);
    }

    return userId;
  }

  public setUserAgent(userAgent: string) {
    this.userAgent = userAgent;
    this.visitor.set('userAgentOverride', this.userAgent);
    Logger.info(`User Agent for Google Analytics is "${this.userAgent}"`);
  }

  public setDevOrProd(devOrProd: DevOrProd): void {
    this.devOrProd = devOrProd;
  }

  public trackEvent(category: string, action: string, label?: string, value?: string | number): void {
    if (!this.userAgent)
      throw new Error('User Agent needs to be set before calling Analytics.trackEvent');

    if (!this.devOrProd)
      throw new Error('"Dev" or "Prod" needs to be set before calling Analytics.trackEvent');

    const eventCategory = `${this.devOrProd}; ${category}`;
    const eventAction = `${this.devOrProd}; ${action}`;
    const eventLabel = label ? `${this.devOrProd}; ${label}` : undefined;

    this.visitor
      .event({
        ec: eventCategory,
        ea: eventAction,
        el: eventLabel,
        ev: value,
      })
      .send();
  }
}
