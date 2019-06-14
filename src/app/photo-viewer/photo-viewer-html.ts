import { Photo } from '../shared/model/photo.model';
import { Dimensions } from '../shared/model/dimensions.model';

export class PhotoViewerHtml {
  public static create(photo: Photo, viewerDimensions: Dimensions): string {
    const escapedPhotoPath = photo.path.replace(/\\/g, '\\\\');

    return `
        <!DOCTYPE html>
        <html lang="en-us">
          <head>
            <title>${photo.name}</title>
            <meta charset="UTF-8">
            <style type="text/css">
              html,
              body {
                background-color: black;
                height: 100%;
                margin: 0;
                overflow: hidden;
              }

              img {
                height: 100%;
                width: 100%;
                object-fit: contain;
                image-orientation: from-image;
              }

              button {
                position: absolute;
                top: 90%;
                left: 90%;
                transform: translate(-50%, -50%);
                background-color: #555;
                color: white;
                font-size: 16px;
                padding: 12px 24px;
                border: none;
                cursor: pointer;
                border-radius: 5px;
                text-align: center;
                opacity: 0;
                transition: opacity .35s ease;
              }

              .container:hover button {
                opacity: 1;
              }

              button:hover {
                background-color: #303030;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <img src="${photo.path}" width="${viewerDimensions.width}" height="${viewerDimensions.height}" alt="${photo.name}">
              <button>Rotate</button>
            </div>
            <script>
              console.info('This is the photo viewer for ' + '${escapedPhotoPath}');
            </script>
          </body>
        </html>
    `;
  }
}
