import { v4 as uuidv4 } from 'uuid';

let sessionId: string | undefined;

/**
 * The ID of this launch, made when it is first asked for: the session of the main process's events
 * (AnalyticsBackendWrapper), and of its launch file (src-main/launch/), which are written before analytics are set.
 */
export function launchSessionId(): string {
  sessionId ??= uuidv4();
  return sessionId;
}
