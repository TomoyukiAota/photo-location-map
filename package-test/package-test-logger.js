const moment = require('moment-timezone');

module.exports = class PackageTestLogger
{
    static dateTime() {
        return moment.utc().format("YYYY-MM-DDTHH:mm:ss.SSS[Z]");
    }

    static error(message) {
        console.error(`[${this.dateTime()}] [error] ${message}`);
    }

    static warn(message) {
        console.warn(`[${this.dateTime()}] [warn] ${message}`);
    }

    static info(message) {
        console.info(`[${this.dateTime()}] [info] ${message}`);
    }
}
