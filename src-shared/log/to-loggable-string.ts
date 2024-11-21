import * as _ from 'lodash';

export function toLoggableString(value: any): string {
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }
  if (_.isObject(value)) { // includes arrays
    return JSON.stringify(value, null, 2);
  }
  return value.toString();
}
