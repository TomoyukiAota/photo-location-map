const download = (url) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = url.split('/').pop();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const version = '0.3.0';
const downloadDirectory = `https://github.com/TomoyukiAota/photo-location-map/releases/download/v${version}`;
const downloadLink = {
  win: `${downloadDirectory}/Photo-Location-Map-Setup-${version}.exe`,
  mac: `${downloadDirectory}/Photo-Location-Map-${version}.dmg`
};

const downloadForWindows = () => download(downloadLink.win);
const downloadForMacos   = () => download(downloadLink.mac);
