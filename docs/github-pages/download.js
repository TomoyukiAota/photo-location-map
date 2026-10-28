const download = (url) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = url.split('/').pop();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const version = '1.12.1';
const downloadDirectory = `https://github.com/TomoyukiAota/photo-location-map/releases/download/v${version}`;
const downloadLink = {
  win: `${downloadDirectory}/Photo-Location-Map-Setup-${version}.exe`,
  mac: `${downloadDirectory}/Photo-Location-Map-${version}-universal.dmg`
};

// Tells the analytics backend that a download starts (analytics.js), unless that script did not
// load, then starts it. trigger is what started it: 'button', 'page' or 'link'.
const startDownload = (os, url, trigger) => {
  if (window.PhotoLocationMapAnalytics) window.PhotoLocationMapAnalytics.trackStartedDownload(os, trigger);
  download(url);
};

const downloadForWindows = (trigger) => startDownload('windows', downloadLink.win, trigger);
const downloadForMacos   = (trigger) => startDownload('macos', downloadLink.mac, trigger);
