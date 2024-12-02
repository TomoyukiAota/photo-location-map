const args = process.argv.slice(1);
const isLiveReloadMode = args.some(val => val === '--live-reload');

export class LiveReload {
  public static get enabled() { return isLiveReloadMode; }
}
