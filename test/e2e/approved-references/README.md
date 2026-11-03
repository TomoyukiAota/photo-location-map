# Approved HEIC output

On 2026-11-02 the owner explicitly approved adopting the newer HEIC decoder's
pixel output and updating/revalidating it. This does not authorize publication.

`heic-thumbnail-libheif-1.23.5.json` records the previously measured output of
heic-decode 2.1.0 / libheif-js 1.23.5 for the existing public `demo.heic` fixture.
It is not generated from the updated test run. The real worker must match these
exact dimensions and decoded-JPEG RGBA SHA-256 on each platform.

The original `snapshots/heic-thumbnail.json` remains unchanged as the historical
baseline. Original screenshots and tolerances also remain unchanged. This
separate reference captures the expressly approved image-output exception;
it is not permission to regenerate references for other changes.

See the task's decoder comparison and security review. This version improves
the previously reviewed decoder defects but does not contain native libheif
1.23.7's HEVC CPU-exhaustion fix.
