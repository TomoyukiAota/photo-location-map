import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { Logger } from '../../../../src-shared/log/logger';
import { PlmInternalRenderer, PlmInternalRendererMap } from '../../../global-variables/global-variable-for-internal-use-in-renderer';
import { getMapType, MapType } from './map-type';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit, OnDestroy {
  public mapType = MapType;
  public selectedMap = MapType.OpenStreetMap;

  constructor(private changeDetectorRef: ChangeDetectorRef,
              private ngZone: NgZone) {
  }

  ngOnInit() {
    window.plmInternalRenderer = window.plmInternalRenderer || new PlmInternalRenderer();
    window.plmInternalRenderer.map = window.plmInternalRenderer.map || new PlmInternalRendererMap();
    window.plmInternalRenderer.map.changeMap = ipcMapChangeArg => this.changeMap(ipcMapChangeArg);
  }

  ngOnDestroy(): void {
    window.plmInternalRenderer.map.changeMap = null;
  }

  public changeMap(ipcMapChangeArg: string) {
    this.ngZone.run(() => {
      this.selectedMap = getMapType(ipcMapChangeArg);
      this.changeDetectorRef.detectChanges();
      Logger.info(`Changed Map: ${ipcMapChangeArg}`);
    });
  }
}
