// One event as the analytics backend receives it.
export interface AnalyticsBackendEvent {
  event_id: string;
  user_id: string;
  session_id: string;
  seq: number;
  client_ts: string;
  app_version: string;
  os: string;
  os_release: string;
  category: string;
  action: string;
  label: string | null;
  value: string | number | null;
}
