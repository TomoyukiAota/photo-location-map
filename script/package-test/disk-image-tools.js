import { spawnSync } from 'child_process';

// TL;DR: Use diskutil's supported disk-image commands where available.
// Details: macOS 27 warns that hdiutil attach/detach are deprecated. The local
// diskutil(8) manual dates image attach to macOS 13, but probe the installed
// tool instead of assuming a version. A no-argument attach only prints usage;
// it never mounts an image. Older tools retain the existing hdiutil commands.
// An actual attach failure must still fail the smoke test, without a fallback
// that could hide a damaged image or permission problem. diskutil has no
// image detach verb; its documented equivalent is eject, accepting a mountpoint.
function getDiskImageTools(run = spawnSync) {
  const probe = run('/usr/sbin/diskutil', ['image', 'attach'], { encoding: 'utf8' });
  const help = `${probe.stdout ?? ''}\n${probe.stderr ?? ''}`;
  if (probe.status === 0 && /usage:\s+diskutil image attach\b/i.test(help)) {
    return { attach: '/usr/sbin/diskutil image attach', detach: '/usr/sbin/diskutil', detachVerb: 'eject' };
  }
  return { attach: '/usr/bin/hdiutil attach', detach: '/usr/bin/hdiutil', detachVerb: 'detach' };
}

export default getDiskImageTools;
