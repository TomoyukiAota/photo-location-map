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
        width: 100vw;
        height: 100vh;
        object-fit: contain;
        transition: transform 0.3s ease-in-out;
      }

      button {
        position: absolute;
        top: 90%;
        left: 90%;
        transform: translate(-50%, -50%);
        background-color: #555555;
        color: white;
        font-size: 16px;
        padding: 12px 24px;
        border: none;
        outline: none;
        cursor: pointer;
        border-radius: 5px;
        text-align: center;
        opacity: 0;
        transition: opacity 0.3s ease, background-color 0.2s ease;
      }

      .container:hover button {
        opacity: 1;
      }

      button:hover {
        background-color: #777777;
      }

      button:active {
        background-color: #1c1ad6;
      }
    </style>
    `;
  }
}
