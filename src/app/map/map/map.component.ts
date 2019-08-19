import { Component, OnInit } from '@angular/core';
import { MapType } from './map-type';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {
  public mapType = MapType;
  public selectedMap = MapType.OpenStreetMap;

  constructor() { }

  ngOnInit() {
  }

}
