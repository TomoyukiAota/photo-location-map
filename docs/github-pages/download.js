const download = (url) => {
  const a = document.createElement('a');
  a.href = url;
  a.download = url.split('/').pop();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const downloadForWindows = () => download('https://github.com/TomoyukiAota/photo-location-map/releases/download/v0.1.0/Photo-Location-Map-Setup-0.1.0.exe');
const downloadForMacos   = () => download('https://github.com/TomoyukiAota/photo-location-map/releases/download/v0.1.0/Photo-Location-Map-0.1.0.dmg');
