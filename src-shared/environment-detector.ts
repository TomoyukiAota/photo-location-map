export class EnvironmentDetector {
    public static isKarma() {
        return typeof __karma__ !== 'undefined';
    }

    public static isTest() {
        return this.isKarma();
    }
}
