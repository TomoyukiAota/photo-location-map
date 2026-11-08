# Remove the Google Maps view: report

2026-11-08 (Asia/Tokyo). The owner decided to remove the experimental Google
Maps view, and to decide later whether, and how, to bring back something
equivalent. This records why, what was removed and what stays, and what the
investigation found for bringing it back.

## What it was

- A second map beside the Leaflet one: `GoogleMapsComponent` in
  `src/app/map/google-maps/`, which drew the pinned photos with the Maps
  JavaScript API. `MapComponent` in `src/app/map/map/` showed one of the two
  maps, and switched them on an IPC message from the Map submenu of Help >
  Advanced Menu.
- Only development builds showed that submenu (`visible: DevOrProd.isDev`), and
  `PhotoInfoViewerContent` filled Google's info windows only in them. A
  released build could not switch to Google Maps.
- The API key was the user's own. They wrote it by hand into a file of the
  user data storage (`UserDataStoragePath.GoogleMaps.ApiKey`), as a message in
  the Developer Tools console described.

## Why it was removed

1. **No user could use it.** It was in development builds only, behind a key
   file that only the console described.
2. **It loaded a script over plain HTTP into a renderer with Node.js access.**
   The component loaded `http://maps.google.com/maps/api/js?key=...`. The main
   window runs with `nodeIntegration: true`, `contextIsolation: false` and
   `webSecurity: false`, without a Content Security Policy
   ([`electron-web-preferences.js`](../../../electron-util/electron-web-preferences.js)),
   so a script replaced on the way would have run with Node.js's access to the
   computer. The component also wrote the key to the log in plain text.
3. **It fell behind the Leaflet map.** It drew plain markers and an info
   window, without the Leaflet map's clusters and region selection. It created
   a new map whenever the pinned photos changed, and each map load counts
   against the key's quota; the signals plan fixed it creating two at once
   ([STATUS.md](../20261107_angular-signals-zoneless/STATUS.md), "Findings
   while executing", 1E-1). Its markers were `google.maps.Marker`, which
   Google deprecated in February 2024 in favor of `AdvancedMarkerElement`
   ([deprecations](https://developers.google.com/maps/deprecations)). It waited
   for the API by checking every millisecond, for up to 20 seconds.
4. **Only a person could check it.** Its unit test and its e2e case used a
   stand-in for the API, so the real one needed a key with billing enabled;
   the signals plan left that check to the owner.
5. **What it offered is available otherwise.** The "…" menu of a photo's
   information opens its place in Google Maps and in Google Street View, in
   the OS's browser and without a key
   ([`more-options-menu-items.ts`](../../../src/app/photo-info-viewer/more-options-menu/more-options-menu-items.ts)).
   What went away is a Google map inside the app.

## What was removed

- `src/app/map/google-maps/`: the component, its API loader and key handler,
  and its unit test.
- `src/app/map/map/`: `MapComponent`, `MapType` and its unit test. Home shows
  `LeafletMapComponent` in their place.
- The Map submenu, its IPC message (`IpcConstants.Map`), the renderer's
  listener (`src/ipc-renderer-setup/ipc-renderer-map-setup.ts`) and
  `window.plmInternalRenderer.map`.
- `UserDataStoragePath.GoogleMaps`, the `'google-maps'` requester of
  `PhotoInfoViewerContent`, and `declare var google` in `types/index.d.ts`.
- The e2e case "the Map menu switches to Google Maps, which draws the selected
  photos, and back to OpenStreetMap".

A key file that someone wrote stays where it is; nothing reads it now.

## What stays

- The "Open Google Maps" and "Open Google Street View" items of a photo's "…"
  menu, and the Photo Data Viewer's handling of Google Maps links
  ([`launch-photo-data-viewer.ts`](../../../src-main/photo-data-viewer/launch-photo-data-viewer.ts)).
- The Leaflet map's base layers: OpenStreetMap and three Esri maps
  ([`raster-tile-base-layer-configs-version-1.ts`](../../../src/app/map/leaflet-map/raster-tile-base-layer-configs-version-1.ts)).

## For bringing it back (not decided)

The owner will decide later whether to bring back a Google map, and how. One
way that the investigation looked at is a Google map as one of the Leaflet
map's base layers, so that the clusters and the region selection work on it
too. What that would need, from Google's documentation read on 2026-11-08:

- **More than a URL in the configuration.** The base layers come as URL
  templates from a configuration that the app fetches from the
  photo-location-map-resources repository, with a fallback in the code.
  Google's documented way to show its maps in another library is the Map Tiles
  API's 2D tiles (roadmap, satellite, terrain), which takes code as well:
  - a session token, created with the key and valid for about two weeks
    ([session tokens](https://developers.google.com/maps/documentation/tile/session_tokens),
    [2D tiles](https://developers.google.com/maps/documentation/tile/2d-tiles-overview));
  - the copyright text of the viewport information, shown on the map, usually
    at the bottom right, and the Google Maps logo, not covered by another logo
    such as the map library's
    ([policies](https://developers.google.com/maps/documentation/tile/policies));
  - caching only as the response headers allow, and no offline use (the same
    page).
- **No Google script in the renderer.** Loading the Maps JavaScript API again,
  or a Leaflet plugin built on it, would bring back the risk of point 2 for as
  long as the renderer has Node.js access. The Map Tiles API gives images
  only.
- **The user's own key, with billing.** It would be entered in the Settings
  dialog rather than in a hand-written file, and never logged. The costs would
  be read from Google's pricing then.
- **Tests.** The session and viewport endpoints stubbed in the unit and e2e
  tests, and a real key for the owner's check only.
