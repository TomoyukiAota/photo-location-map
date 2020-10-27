import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../log/logger';
import { AnalyticsInterface } from './analytics-interface';
import { UserDataStorage } from '../user-data-storage/user-data-storage';
import { UserDataStoragePath } from '../user-data-storage/user-data-stroage-path';
import { AnalyticsConfig } from './analytics-config';

export class AnalyticsMain implements AnalyticsInterface {
  private readonly visitor: ReturnType<typeof import('universal-analytics')>;
  private userAgent: string = null;

  constructor() {
    const trackingId = AnalyticsConfig.trackingId;
    const userId = this.getUserId();
    const ua = require('universal-analytics');
    this.visitor = ua(trackingId, userId);
    Logger.info(`[Google Analytics] Tracking ID: ${trackingId}`);
    Logger.info(`[Google Analytics] Property Name: ${AnalyticsConfig.propertyName}`);
    Logger.info(`[Google Analytics] User ID: ${userId}`);
  }

  private getUserId(): string {
    let userId: string;

    try {
      userId = UserDataStorage.read(UserDataStoragePath.Analytics.UserId);
    } catch {
      userId = uuidv4();
      UserDataStorage.write(UserDataStoragePath.Analytics.UserId, userId);
    }

    return userId;
  }

  public setUserAgent(userAgent: string) {
    this.userAgent = userAgent;
    this.visitor.set('userAgentOverride', this.userAgent);
    Logger.info(`[Google Analytics] User Agent for Google Analytics is "${this.userAgent}"`);
  }

  public trackEvent(category: string, action: string, label?: string, value?: string | number): void {
    if (!this.userAgent)
      throw new Error('User Agent needs to be set before calling Analytics.trackEvent');

    this.visitor
      .event({
        ec: category,
        ea: action,
        el: label,
        ev: value,
      })
      .send();
  }
}
