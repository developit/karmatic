# Karmatic [![npm](https://img.shields.io/npm/v/karmatic.svg)](https://npm.im/karmatic) [![travis](https://travis-ci.org/developit/karmatic.svg?branch=master)](https://travis-ci.org/developit/karmatic)

A simplified zero-configuration wrapper around [Karma], [Webpack], [Jasmine] & [Puppeteer].


## Why do I want this?

Karma, Webpack and Jasmine are all great. They're all also quite powerful and each highly configurable. When creating and maintaining small modules, duplication of these configurations and dependencies is cumbersome.

Karmatic is a zero-configuration wrapper around these tools with intelligent defaults, configuration auto-detection, and optimizations most configurations don't include.

Most importantly, Karmatic provides a (headless) browser test harness in a single dependency.


## Installation

```sh
npm i -D karmatic
```

... then add a `test` script to your `package.json`:

```js
{
    "scripts": {
    	"test": "karmatic"
    }
}
```

... now you can run your tests using `npm t`.


### Test File Patterns

By default, Karmatic will find tests in any files ending in `.test.js` or `_test.js`.
You can change this to any minimatch pattern _(note the quotes to avoid shell expansion)_:

```sh
karmatic '**/*Spec.jsx?'
```


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
