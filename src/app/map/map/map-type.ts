import { IpcConstants } from '../../../../src-shared/ipc/ipc-constants';

export enum MapType {
  GoogleMaps,
  OpenStreetMap
}

export const getMapType = (ipcMapChangeArg: string) => {
  switch (ipcMapChangeArg) {
    case IpcConstants.Map.ChangeEvent.Arg.GoogleMaps:
      return MapType.GoogleMaps;
    case IpcConstants.Map.ChangeEvent.Arg.OpenStreetMap:
      return MapType.OpenStreetMap;
  }
};
