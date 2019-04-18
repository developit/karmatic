# Karmatic [![npm](https://img.shields.io/npm/v/karmatic.svg)](https://npm.im/karmatic) [![travis](https://travis-ci.org/developit/karmatic.svg?branch=master)](https://travis-ci.org/developit/karmatic)

A simplified zero-configuration wrapper around [Karma], [Webpack], [Jasmine] & [Puppeteer].


## Why do I want this?

Karma, Webpack and Jasmine are all great. They're all also quite powerful and each highly configurable. When creating and maintaining small modules, duplication of these configurations and dependencies is cumbersome.

Karmatic is a zero-configuration wrapper around these tools with intelligent defaults, configuration auto-detection, and optimizations most configurations don't include.

Most importantly, Karmatic provides a (headless) browser test harness in a single dependency.


## Installation

```sh
npm i -D webpack karmatic
```

... then add a `test` script to your `package.json`:

```js
{
    "scripts": {
    	"test": "karmatic"
    }
}
```

... now you can run your tests using `npm t`. Here's a [minimal example repo](https://gist.github.com/developit/acd8a075350eeb6574439e92888c50cf).


### Test File Patterns

By default, Karmatic will find tests in any files ending in `.test.js` or `_test.js`.
You can change this to any minimatch pattern _(note the quotes to avoid shell expansion)_:

```sh
karmatic '**/*Spec.jsx?'
```

### Options

`--chromeDataDir <filename>`

Filename to be used to save Chrome preferences between test runs. Useful for debugging tests. It is recommended to also add this filename to `.gitignore`.

Example:
```
karmatic --chromeDataDir .chrome
```

## Usage

```text
Usage
    $ karmatic <command> [options]

Available Commands
    run      Run tests once and exit
    watch    Run tests on any change
    debug    Open a headful Puppeteer instance for debugging your tests

For more info, run any command with the `--help` flag
    $ karmatic run --help
    $ karmatic watch --help

Options
    -v, --version    Displays current version
    --files          Minimatch pattern for test files
    --headless       Run using Chrome Headless  (default true)
    --coverage       Report code coverage of tests  (default true)
    -h, --help       Displays this message
```

To disable any option that defaults to `true`, pass `false` to the option: `--headless false` or `--coverage false`.

NOTE: The `debug` option overrides the default value of the `--headless` and `--coverage` option to be `false`. This option will also open up the local Puppeteer installation of Chrome, not your globally installed one. If you'd like to debug your tests using your your own instance of Chrome (or any other browser), copy the URL from the puppeteer window into your favorite browser.


## FAQ

**Q**: [Is there an FAQ?](https://twitter.com/gauntface/status/956259291928776704)**

> Yes.


## Projects Using Karmatic

Karmatic is pretty new! Here are some projects that have switched to it you may use as a reference:

- [workerize-loader](https://github.com/developit/workerize-loader/commit/afaa20bbfbdec1d6a5523ec69ba2a2d5d495cfd6)


## License

[MIT](https://oss.ninja/mit/developit) © [developit](https://github.com/developit)


[Karma]: https://karma-runner.github.io
[Webpack]: https://webpack.js.org
[Jasmine]: https://jasmine.github.io
[Puppeteer]: https://github.com/GoogleChrome/puppeteer
