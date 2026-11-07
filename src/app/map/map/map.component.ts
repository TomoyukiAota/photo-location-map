import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { Logger } from '../../../../src-shared/log/logger';
import { PlmInternalRenderer, PlmInternalRendererMap } from '../../../global-variables/global-variable-for-internal-use-in-renderer';
import { getMapType, MapType } from './map-type';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss'],
  standalone: false
})
export class MapComponent implements OnInit, OnDestroy {
  public readonly mapType = MapType;
  /** The map that is shown, which the Help menu of the main process changes. */
  public readonly selectedMap = signal(MapType.OpenStreetMap);

  public ngOnInit(): void {
    window.plmInternalRenderer = window.plmInternalRenderer || new PlmInternalRenderer();
    window.plmInternalRenderer.map = window.plmInternalRenderer.map || new PlmInternalRendererMap();
    window.plmInternalRenderer.map.changeMap = ipcMapChangeArg => this.changeMap(ipcMapChangeArg);
  }

  public ngOnDestroy(): void {
    window.plmInternalRenderer.map.changeMap = null;
  }

  public changeMap(ipcMapChangeArg: string) {
    this.selectedMap.set(getMapType(ipcMapChangeArg));
    Logger.info(`Changed Map: ${ipcMapChangeArg}`);
  }
}
