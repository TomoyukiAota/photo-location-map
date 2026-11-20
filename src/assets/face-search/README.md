# The face detector of the search for faces

The Selection menu's **Narrow Down to Photos with Faces** looks for faces with
YuNet, the face detector of OpenCV, run by ONNX Runtime Web in a worker of the
page (`src/app/face-search/`).

| File | What it is |
| --- | --- |
| `face_detection_yunet_2023mar.onnx` | YuNet, as OpenCV Zoo publishes it: [`models/face_detection_yunet/face_detection_yunet_2023mar.onnx`](https://github.com/opencv/opencv_zoo/blob/f12e12798e8314f7c074a6656816c048dcc95b7a/models/face_detection_yunet/face_detection_yunet_2023mar.onnx) at commit `f12e12798e83`, 232,589 bytes, SHA-256 `8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4`. Its input is fixed at 640 by 640 pixels. |
| `LICENSE` | YuNet's license, MIT, from the same folder of OpenCV Zoo, which comes with the model wherever it goes. |
| `ort-wasm-simd-threaded.wasm` | Not here: the build copies ONNX Runtime Web's WebAssembly here from `node_modules/onnxruntime-web/dist/` (`angular.json`'s assets), so that it is always that of the version installed. |

The model runs on this computer only: nothing of the photos or of what is
found in them is sent anywhere.

The threshold of a face's score, 0.8, and the measurements that chose YuNet
are in `docs/tasks/20261121_face-search/STATUS.md`.
