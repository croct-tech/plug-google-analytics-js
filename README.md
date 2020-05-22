<p align="center">
    <a href="https://croct.com">
        <img src="https://cdn.croct.io/brand/logo/repo-icon-green.svg" alt="Croct" height="80"/>
    </a>
    <br />
    <strong>Google Analytics Plugin</strong>
    <br />
    A <a href="https://github.com/croct-tech/plug-js">PlugJS</a> plugin for exporting events to Google Analytics.
</p>
<p align="center">
    <a href="https://www.npmjs.com/package/@croct/plug-google-analytics"><img alt="Version" src="https://img.shields.io/npm/v/@croct/plug-google-analytics" /></a>
    <a href="https://github.com/croct-tech/plug-google-analytics-js/actions?query=workflow%3AValidations"><img alt="Build" src="https://github.com/croct-tech/plug-google-analytics-js/workflows/Validations/badge.svg" /></a>
    <a href="https://codeclimate.com/repos/5ec4422d224b7501a000afbc/maintainability"><img alt="Maintainability" src="https://api.codeclimate.com/v1/badges/2da784570594f1f11c56/maintainability" /></a>
    <a href="https://codeclimate.com/repos/5ec4422d224b7501a000afbc/test_coverage"><img alt="Coverage" src="https://api.codeclimate.com/v1/badges/2da784570594f1f11c56/test_coverage" /></a>
    <br />
    <br />
    <a href="https://github.com/croct-tech/plug-google-analytics-js/releases">📦Releases</a>
    ·
    <a href="https://github.com/croct-tech/plug-google-analytics-js/issues/new?labels=bug&template=bug-report.md">🐞Report Bug</a>
    ·
    <a href="https://github.com/croct-tech/plug-google-analytics-js/issues/new?labels=enhancement&template=feature-request.md">✨Request Feature</a>
</p>

## Installation

The recommended way to install this plugin is using NPM. It pairs nicely with module bundlers such as Rollup, Webpack or Browserify and includes Typescript typings.

Run the following command to install the latest version:

```sh
npm install @croct/plug-google-analytics
```

## Basic usage

```typescript
import croct from '@croct/plug';
// Install the plugin
import '@croct/plug-google-analytics';

croct.plug({
    plugins: {
        googleAnalytics: {},
    }
});
```

## Contributing
Contributions to the package are always welcome! 

- Report any bugs or issues on the [issue tracker](https://github.com/croct-tech/plug-google-analytics-js/issues).
- For major changes, please [open an issue](https://github.com/croct-tech/plug-google-analytics-js/issues) first to discuss what you would like to change.
- Please make sure to update tests as appropriate.

## Testing

Before running the test suites, the development dependencies must be installed:

```sh
npm install
```

Then, to run all tests:

```sh
npm run test
```

Run the following command to check the code against the style guide:

```sh
npm run lint
```

## Building

Before building the project, the dependencies must be installed:

```sh
npm install
```

Then, to build the CommonJS module:

```sh
npm run build
```

## Copyright Notice

This project is released under the [MIT License](LICENSE).
