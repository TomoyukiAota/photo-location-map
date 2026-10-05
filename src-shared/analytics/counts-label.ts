// Counts of things such as file extensions, as a JSON object for an event label, most common first.
// One event carries the whole list, so that a folder with many kinds of files does not produce many events.
// A label must fit the analytics backend's limit of 16 KiB: if the counts do not, the most common are kept and
// the rest are added up as "(other)".
export const otherKey = '(other)';

export function countsLabel(counts: ReadonlyMap<string, number>, maxLength = 16000): string {
  // Array.from rather than spreading: it works whatever the compile target.
  const entries = Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  const room = maxLength - `,${JSON.stringify(otherKey)}:${Number.MAX_SAFE_INTEGER}}`.length;

  const kept: [string, number][] = [];
  let length = 1;  // "{"
  let other = 0;
  for (const [key, count] of entries) {
    const entryLength = (kept.length > 0 ? 1 : 0) + JSON.stringify(key).length + 1 + String(count).length;
    if (other === 0 && length + entryLength <= room) {
      kept.push([key, count]);
      length += entryLength;
    } else {
      other += count;
    }
  }

  const result: Record<string, number> = {};
  for (const [key, count] of kept)
    result[key] = count;
  if (other > 0)
    result[otherKey] = (result[otherKey] ?? 0) + other;
  return JSON.stringify(result);
}

export function countBy(keys: readonly string[]): Map<string, number> {
  const counts = new Map<string, number>();
  keys.forEach(key => counts.set(key, (counts.get(key) ?? 0) + 1));
  return counts;
}
