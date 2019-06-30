import * as path from 'path';
import * as uuid from 'uuid/v4';
import { Logger } from '../log/logger';
import { AnalyticsInterface } from './analytics-interface';
import { ConditionalRequire } from '../require/conditional-require';

export class AnalyticsMain implements AnalyticsInterface {
  private readonly fs = require('fs');
  private readonly dirPath = path.join(ConditionalRequire.electron.app.getPath('userData'), 'analytics');
  private readonly filePath = path.join(this.dirPath, 'user-id.json');
  private readonly trackingId = 'UA-143091961-1';
  private readonly usr: ReturnType<typeof import('universal-analytics')>;

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

  public trackEvent(category: string, action: string, label?: string, value?: string | number): void {
    this.usr
      .event({
        ec: category,   // TODO: Add "Prod" or "Dev" prefix to category.
        ea: action,
        el: label,
        ev: value,
      })
      .send();
  }
}
