# Photo Location Map

This application displays the locations where your photos are taken on Google Maps.

Currently, this application is a work in progress.

Development of this application is started by using [maximegris/angular-electron](https://github.com/maximegris/angular-electron). [The contents of the respository as of commit 7618abcea496a26656be11f31542713b728919e9 (on Dec 31, 2018)](https://github.com/maximegris/angular-electron/tree/7618abcea496a26656be11f31542713b728919e9) are used with some modification and removal.

<hr>

# Development Information

## CI Status

| OS             | Status                             |
|:--------------:|:----------------------------------:|
| Windows        | [![appveyor-image]][appveyor-link] |
| macOS & Ubuntu | [![travisci-image]][travisci-link] |

[appveyor-image]: https://ci.appveyor.com/api/projects/status/5v9p3ccw0jj0pgwn/branch/master?svg=true
[appveyor-link]: https://ci.appveyor.com/project/TomoyukiAota/photo-location-map/branch/master
[travisci-image]: https://travis-ci.org/TomoyukiAota/photo-location-map.svg?branch=master
[travisci-link]: https://travis-ci.org/TomoyukiAota/photo-location-map

## Getting Started

Clone this repository locally :

``` bash
git clone https://github.com/TomoyukiAota/photo-location-map.git
```

Install dependencies with npm :

``` bash
npm install
```

There is an issue with `yarn` and `node_modules` that are only used in electron on the backend when the application is built by the packager. Please use `npm` as dependencies manager.


If you want to generate Angular components with Angular-cli , you **MUST** install `@angular/cli` in npm global context.
Please follow [Angular-cli documentation](https://github.com/angular/angular-cli) if you had installed a previous version of `angular-cli`.

``` bash
npm install -g @angular/cli
```

## To build for development

- **in a terminal window** -> npm start

The application code is managed by `main.ts`. The application runs with a simple Angular App (http://localhost:4200) and an Electron window.
The Angular component contains an example of Electron and NodeJS native lib import.
You can disable "Developer Tools" by commenting `win.webContents.openDevTools();` in `main.ts`.

## Included Commands

|Command|Description|
|--|--|
|`npm run ng:serve:web`| Execute the app in the browser |
|`npm run build`| Build the app. Your built files are in the /dist folder. |
|`npm run build:prod`| Build the app with Angular aot. Your built files are in the /dist folder. |
|`npm run electron:local`| Builds your application and start electron
|`npm run electron:linux`| Builds your application and creates an app consumable on linux system |
|`npm run electron:windows`| On a Windows OS, builds your application and creates an app consumable in windows 32/64 bit systems |
|`npm run electron:mac`|  On a MAC OS, builds your application and generates a `.app` file of your application that can be run on Mac |

**Your application is optimised. Only /dist folder and node dependencies are included in the executable.**

## You want to use a specific lib (like rxjs) in electron main thread?

You can do this! Just by importing your library in npm dependencies (not devDependencies) with `npm install --save`. It will be loaded by electron during build phase and added to the final package. Then use your library by importing it in `main.ts` file.

## Browser mode

Maybe you want to execute the application in the browser with hot reload? You can do it with `npm run ng:serve:web`.
Note that you can't use Electron or NodeJS native libraries in this case. Please check `providers/electron.service.ts` to watch how conditional import of electron/Native libraries is done.
