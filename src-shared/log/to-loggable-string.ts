import isObject from 'lodash-es/isObject.js';

export function toLoggableString(value: any): string {
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }
  if (isObject(value)) { // includes arrays
    return JSON.stringify(value, null, 2);
  }
  return value.toString();
}
