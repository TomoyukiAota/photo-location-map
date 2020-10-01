import { Component, ChangeDetectionStrategy, AfterViewInit } from '@angular/core';
import Split from 'split.js';
import { OsmForceRenderService } from '../map/osm/osm-force-render/osm-force-render.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home',
  styleUrls: ['./home.component.scss'],
  templateUrl: './home.component.html'
})
export class HomeComponent implements AfterViewInit {
  constructor(private osmForceRenderService: OsmForceRenderService) {}

  ngAfterViewInit() {
    Split(['#left-sidebar', '#right-map'], {
      sizes: [25, 75],
      minSize: 200,
    });

    // OSM needs to be rendered again after Split.js starts working. Otherwise, OSM is not rendered correctly.
    this.osmForceRenderService.forceRenderOsmWithoutPhoto();
  }
}
