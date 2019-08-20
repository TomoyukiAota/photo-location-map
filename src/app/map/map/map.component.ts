import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
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
    window.plmInternalRenderer.map.changeMap = mapTypeStr => this.changeMap(mapTypeStr);
  }

  ngOnDestroy(): void {
    window.plmInternalRenderer.map.changeMap = null;
  }

  public changeMap(mapTypeStr: string) {
    this.ngZone.run(() => {
      this.selectedMap = getMapType(mapTypeStr);
      console.log(`changeMap called with ${mapTypeStr}`);
      this.changeDetectorRef.detectChanges();
    });
  }
}
