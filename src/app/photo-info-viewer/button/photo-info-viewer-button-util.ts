export function createPhotoInfoViewerButton(onClick: (event: MouseEvent) => void, imgSrc: string, tooltipText: string) {
  const button = document.createElement('button');
  button.classList.add('photo-info-viewer-button');
  button.onclick = event => {
    event.stopPropagation();
    onClick(event);
  };
  button.ondblclick = event => {
    event.stopPropagation();
  };

  const icon = createPhotoInfoViewerButtonIcon(imgSrc, tooltipText);

  button.appendChild(icon);
  return button;
}

function createPhotoInfoViewerButtonIcon(imgSrc, tooltipText) {
  const icon = document.createElement('img');
  icon.className = 'photo-info-viewer-button-icon';
  icon.src = imgSrc;
  icon.title = tooltipText;
  return icon;
}
