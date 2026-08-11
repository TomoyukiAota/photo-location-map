const download = (url) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = url.split('/').pop();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const version = '1.11.0';
const downloadDirectory = `https://github.com/TomoyukiAota/photo-location-map/releases/download/v${version}`;
const downloadLink = {
  win: `${downloadDirectory}/Photo-Location-Map-Setup-${version}.exe`,
  // The macOS package is a universal build from v1.11.1 onwards, and "-universal" needs to be added to the file name below when the version above is updated to v1.11.1 or later.
  mac: `${downloadDirectory}/Photo-Location-Map-${version}.dmg`
};

const downloadForWindows = () => download(downloadLink.win);
const downloadForMacos   = () => download(downloadLink.mac);
