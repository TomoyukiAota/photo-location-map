export function createPhotoInfoViewerButton(onClick: (event: MouseEvent) => void, imgSrc: string, tooltipText: string) {
  const button = document.createElement('button');
  button.classList.add('photo-info-viewer-button');
  button.onclick = onClick;

  const icon = createPhotoInfoViewerButtonIcon(imgSrc);
  const tooltip = createPhotoInfoViewerButtonTooltip(tooltipText);

  button.appendChild(icon);
  button.appendChild(tooltip);
  return button;
}

function createPhotoInfoViewerButtonIcon(imgSrc) {
  const icon = document.createElement('img');
  icon.className = 'photo-info-viewer-button-icon';
  icon.src = imgSrc;
  return icon;
}

function createPhotoInfoViewerButtonTooltip(text) {
  const tooltip = document.createElement('span');
  tooltip.className = 'photo-info-viewer-button-tooltip';
  tooltip.innerText = text;
  return tooltip;
}
