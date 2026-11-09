import * as os from 'os';

/** The user's name, or '' where os.userInfo() throws, as it does where the user has no name, such as in some containers. */
export function userNameOrEmpty(): string {
  try {
    return os.userInfo().username;
  } catch {
    return '';
  }
}
