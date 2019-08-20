import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { PlmGlobalRendererInternal } from '../../../global-varriable-renderer';
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
    window.plmGlobalRendererInternal = window.plmGlobalRendererInternal || new PlmGlobalRendererInternal();
    window.plmGlobalRendererInternal.map = window.plmGlobalRendererInternal.map || {};
    window.plmGlobalRendererInternal.map.changeMap = this.changeMap.bind(this);
  }

  ngOnDestroy(): void {
    window.plmGlobalRendererInternal.map.changeMap = null;
  }

  public changeMap(mapTypeStr: string) {
    this.ngZone.run(() => {
      this.selectedMap = getMapType(mapTypeStr);
      console.log(`changeMap called with ${mapTypeStr}`);
      this.changeDetectorRef.detectChanges();
    });
  }
}
