/**
 * Records a User Timing mark named `plm:<name>`, for the performance comparisons of
 * docs/tasks/20261106_remove-electron-remote/PERFORMANCE.md, which test/performance/ reads with
 * `performance.getEntriesByType('mark')`.
 *
 * A mark records a time, and `detail` if given, and changes nothing else. It works the same in the main process
 * (Node.js's perf_hooks) and in a renderer with or without Node.js, so a measurement means the same before and after
 * the renderer loses Node.js. Marks are few: one per step of a launch, a folder open or a View Data, so they stay small
 * however long the application runs.
 */
export function perfMark(name: string, detail?: unknown): void {
  try {
    performance.mark(`plm:${name}`, detail === undefined ? undefined : { detail });
  } catch {
    // A mark must never break what it measures.
  }
}
