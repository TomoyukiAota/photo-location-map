/* tslint:disable:no-console */

import * as moment from 'moment-timezone';
import { ProcessUtil } from './process-util';

export class Logger {
    public static error(message: string, ...object: any) {
        const text = this.generateLogText(message, 'error');
        console.error(text, ...object);
    }

    public static warn(message: string, ...object: any) {
        const text = this.generateLogText(message, 'warn');
        console.warn(text, ...object);
    }

    public static info(message: string, ...object: any) {
        const text = this.generateLogText(message, 'info');
        console.info(text, ...object);
    }

    public static debug(message: string, ...object: any) {
        const text = this.generateLogText(message, 'debug');
        console.debug(text, ...object);
    }

    private static dateTime() {
        return moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
    }

    private static generateLogText(message: string, level: string): string {
        const dateTime = this.dateTime();
        const processType = ProcessUtil.processType();
        return `[${dateTime}] [${processType}] [${level}] ${message}`;
    }
}
