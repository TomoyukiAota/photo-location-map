/**
 * The places that show a photo's information: a row of the folder tree, a popup of the map (a marker's, and the pane
 * of a cluster's popup that shows the chosen photo), and a tile of a cluster's popup. Each lays the information out
 * in its own way, and turns the photo's thumbnail on its own.
 */
export type PhotoInfoViewerPlace = 'dir-tree-view' | 'leaflet-map-popup' | 'leaflet-map-tile';
