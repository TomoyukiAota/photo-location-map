import { app } from 'electron';
import * as os from 'os';
import { setScrubbingContext } from '../../src-shared/analytics/record-error';

// What the main process's errors are scrubbed of before analytics records them: the app's own folder, the home folder
// and the user name. Set first in src-main/electron-main.ts, as an error can be recorded from the start.
setScrubbingContext(() => ({ appPaths: [app.getAppPath()], sensitiveStrings: [os.homedir(), os.userInfo().username] }));
