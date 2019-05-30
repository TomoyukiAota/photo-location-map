import { Injectable } from '@angular/core';
import { LazyMapsAPILoaderConfigLiteral } from '@agm/core';
import { GoogleMapsApiKeyHandler } from './google-maps-api-key-handler';

@Injectable()
export class AgmConfig implements LazyMapsAPILoaderConfigLiteral {
  public apiKey: string;

  constructor() {
    this.apiKey = GoogleMapsApiKeyHandler.fetchApiKey();
  }
}
