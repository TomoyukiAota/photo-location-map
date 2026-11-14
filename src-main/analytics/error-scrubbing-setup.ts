import { app } from 'electron';
import * as os from 'os';
import { setScrubbingContext } from '../../src-shared/analytics/record-error.js';
import { userNameOrEmpty } from '../os/user-name.js';

// What the main process's errors are scrubbed of before analytics records them: the app's own folder, the home folder
// and the user name. Set first in src-main/electron-main.ts, as an error can be recorded from the start.
// os.userInfo() can throw, and an error here would keep every error of the main process from being recorded.
setScrubbingContext(() => ({ appPaths: [app.getAppPath()], sensitiveStrings: [os.homedir(), userNameOrEmpty()].filter(Boolean) }));
