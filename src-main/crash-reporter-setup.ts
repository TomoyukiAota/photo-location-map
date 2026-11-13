import { crashReporter } from 'electron';
import { CrashReportEndpoint } from '../src-shared/analytics/config/crash-report-endpoint';
import { AnalyticsConfig } from '../src-shared/analytics/config/analytics-config';
import { launchSessionId } from '../src-shared/analytics/launch-session';
import { DevOrProd } from '../src-shared/dev-or-prod/dev-or-prod';
import { Logger } from '../src-shared/log/logger';
import { isPrereleaseVersion } from '../src-shared/version/is-prerelease-version';

// TL;DR: Electron's crash reporter uploads a dump of a process that crashes in native code to the analytics backend.
// Details: Nothing of the app runs to record such a crash: a renderer's or a child process's ends as "Process Gone",
// which says that it crashed, not where. The dump tells where (the analytics backend makes its stack), which tells what
// the app made it do (docs/tasks/20261114_record-more-errors/PLAN.md, stage 6). Started before the app is ready, as a
// renderer made before is not watched, and after the settings, which hold the analytics user ID: a dump carries it and
// the launch's session ID, as the events do, so that what the user did before the crash can be told. A renderer's dump
// is uploaded at once; the main process's at the next launch, as its uploader ends with it. A dump holds a part of the
// process's memory, which the Welcome dialog's sentence covers. Tests upload nothing: a test profile, a package test
// and unit tests keep their dumps on the machine, unless a test with a test profile gives an address of its own to
// upload to (PLM_TEST_CRASH_REPORT_URL), to check the reporter.
const isTest = !!process.env.PLM_TEST_ROOT || process.env.PLM_PACKAGE_TEST === 'true' || process.env.PLM_EM_MAIN === 'true';
const testUrl = process.env.PLM_TEST_ROOT ? process.env.PLM_TEST_CRASH_REPORT_URL : undefined;

try {
  crashReporter.start({
    submitURL: testUrl || CrashReportEndpoint.select(DevOrProd.isDev, isPrereleaseVersion()),
    uploadToServer: !!testUrl || !isTest,
    compress: true,
    // Crashpad uploads at most one dump an hour by default; a renderer that crashes again and again is worth each.
    rateLimit: false,
    globalExtra: { user_id: AnalyticsConfig.userId, session_id: launchSessionId() },
  });
} catch (error) {
  Logger.error('Could not start the crash reporter.', error);
}
