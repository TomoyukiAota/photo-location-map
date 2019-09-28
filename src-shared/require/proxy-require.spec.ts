import { ProxyRequire } from './proxy-require';

describe('ProxyRequire (in renderer process)', () => {
  it('electron should not be null', () => {
    expect(ProxyRequire.electron).not.toBeNull();
  });

  it('electron should be window.require("electron")', () => {
    expect(ProxyRequire.electron).toBe(window.require('electron'));
  });

  it('os should not be null', () => {
    expect(ProxyRequire.os).not.toBeNull();
  });

  it('os should be window.require("os")', () => {
    expect(ProxyRequire.os).toBe(window.require('os'));
  });

  it('path should not be null', () => {
    expect(ProxyRequire.path).not.toBeNull();
  });

  it('path should be window.require("path")', () => {
    expect(ProxyRequire.path).toBe(window.require('path'));
  });
});
