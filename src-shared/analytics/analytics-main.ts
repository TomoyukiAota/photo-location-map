import * as path from 'path';
import * as uuid from 'uuid/v4';
import { Logger } from '../log/logger';
import { AnalyticsInterface } from './analytics-interface';
import { ConditionalRequire } from '../require/conditional-require';
import { DevOrProd } from './dev-or-prod';

export class AnalyticsMain implements AnalyticsInterface {
  private readonly fs = require('fs');
  private readonly dirPath = path.join(ConditionalRequire.electron.app.getPath('userData'), 'photo-location-map-analytics');
  private readonly filePath = path.join(this.dirPath, 'user-id.json');
  private readonly trackingId = 'UA-143091961-1';
  private readonly usr: ReturnType<typeof import('universal-analytics')>;
  private userAgent: string = null;
  private devOrProd: DevOrProd = null;

  constructor() {
    const userId = this.getUserId();
    const ua = require('universal-analytics');
    this.usr = ua(this.trackingId, userId);
    Logger.info(`Initialized Google Analytics with user ID "${userId}"`);
  }

  private getUserId(): string {
    let userId: string;

    try {
      userId = this.readUserIdFromFile();
    } catch {
      userId = uuid();
      const jsonObject = { userId: userId };
      this.writeJsonFile(jsonObject);
    }

    return userId;
  }

  private readUserIdFromFile(): string {
    if (!this.fs.existsSync(this.filePath))
      throw new Error(`File for userId does not exist in ${this.filePath}`);

    const fileContent = this.fs.readFileSync(this.filePath, 'utf8');
    const jsonObject = JSON.parse(fileContent);
    return jsonObject.userId;
  }

  private writeJsonFile(object: any): void {
    if (!this.fs.existsSync(this.dirPath)) {
      this.fs.mkdirSync(this.dirPath);
    }
    this.fs.writeFileSync(this.filePath, JSON.stringify(object));
  }

  public setUserAgent(userAgent: string) {
    this.userAgent = userAgent;
    this.usr.set('ua', this.userAgent);
    Logger.info(`User Agent for Google Analytics is "${userAgent}"`);
  }

  public setDevOrProd(devOrProd: DevOrProd): void {
    this.devOrProd = devOrProd;
  }

  public trackEvent(category: string, action: string, label?: string, value?: string | number): void {
    if (!this.devOrProd)
      throw new Error('"Dev" or "Prod" needs to be set before calling Analytics.trackEvent');

    const eventCategory = `${this.devOrProd}; ${category}`;
    const eventAction = `${this.devOrProd}; ${action}`;
    const eventLabel = label ? `${this.devOrProd}; ${label}` : undefined;

    this.usr
      .event({
        ec: eventCategory,
        ea: eventAction,
        el: eventLabel,
        ev: value,
      })
      .send();
  }
}
