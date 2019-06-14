export class PhotoViewerStyleTag {
  public static create(): string {
    return `
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
    `;
  }
}
