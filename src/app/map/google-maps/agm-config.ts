import { Injectable } from '@angular/core';
import { LazyMapsAPILoaderConfigLiteral } from '@agm/core';
import { GoogleMapsApiKeyHandler } from './google-maps-api-key-handler';

@Injectable()
export class AgmConfig implements LazyMapsAPILoaderConfigLiteral {
  public apiKey: string;
  public libraries: string[];
  constructor() {
    this.apiKey = GoogleMapsApiKeyHandler.apiKey;
    this.libraries = ['places'];
    console.log('lazy map init with ' + this.apiKey);
  }
}
