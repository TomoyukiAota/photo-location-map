export class EnvironmentDetector {
    public static isKarma(): boolean {
        return typeof __karma__ !== 'undefined';
    }

    public static isTest(): boolean {
        return this.isKarma();
    }
}
