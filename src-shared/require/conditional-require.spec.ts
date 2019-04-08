import { ConditionalRequire } from './conditional-require';

describe('ConditionalRequire (in renderer process)', () => {
  it('electron should not be null', () => {
    expect(ConditionalRequire.electron).not.toBeNull();
  });

  it('electron should be window.require("electron")', () => {
    expect(ConditionalRequire.electron).toBe(window.require('electron'));
  });

  it('os should not be null', () => {
    expect(ConditionalRequire.os).not.toBeNull();
  });

  it('os should be window.require("os")', () => {
    expect(ConditionalRequire.os).toBe(window.require('os'));
  });

  it('path should not be null', () => {
    expect(ConditionalRequire.path).not.toBeNull();
  });

  it('path should be window.require("path")', () => {
    expect(ConditionalRequire.path).toBe(window.require('path'));
  });
});
