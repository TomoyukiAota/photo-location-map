import * as moment from 'moment-timezone';
import { Now } from './now';

describe('Now', () => {
  it('basicFormat should return valid date-time string', () => {
    expect(moment(Now.basicFormat).isValid()).toEqual(true);
  });

  it('basicFormat should return date time close to the text start time', () => {
    const testStartTime = moment();
    const oneHourBeforeTestStartTime = testStartTime.clone().subtract(1, 'hour');
    const oneHourAfterTestStartTime = testStartTime.clone().add(1, 'hour');
    const testTargetTime = moment(Now.basicFormat);
    expect(testTargetTime.isBetween(oneHourBeforeTestStartTime, oneHourAfterTestStartTime)).toEqual(true);
  });

  it('extendedFormat should return valid date-time string', () => {
    expect(moment(Now.extendedFormat).isValid()).toEqual(true);
  });

  it('extendedFormat should return date time close to the text start time', () => {
    const testStartTime = moment();
    const oneHourBeforeTestStartTime = testStartTime.clone().subtract(1, 'hour');
    const oneHourAfterTestStartTime = testStartTime.clone().add(1, 'hour');
    const testTargetTime = moment(Now.extendedFormat);
    expect(testTargetTime.isBetween(oneHourBeforeTestStartTime, oneHourAfterTestStartTime)).toEqual(true);
  });
});
