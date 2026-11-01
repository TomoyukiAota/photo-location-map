# HEIC regression fixture

`demo.heic` is the public regression fixture from
[Photo Data Viewer](https://github.com/TomoyukiAota/photo-data-viewer/tree/3facd83ffbf2ae8c110d461481ff9223d3f8f47c/tests/e2e/fixtures).
It was generated with macOS `sips -s format heic` from the repository author's
existing public demo JPEG, sourced from revision
`2ba9ef57fd580cdabc4b26102098064e0b3c8505` of
[photo-data-viewer-resources](https://github.com/TomoyukiAota/photo-data-viewer-resources).
No private photos are used. The zero-byte HEIF files in the older directory-tree
fixtures test extension detection only; they are not decoder inputs.
