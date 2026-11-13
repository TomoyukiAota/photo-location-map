/** Whether a process with this ID runs: Node's process.kill with signal 0 checks it, and sends nothing. */
export function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === 'EPERM';  // It runs, as another user's process.
  }
}
