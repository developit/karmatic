// As of writing, the [jest-matcher-utils] package expects there to be a
// `Buffer` global available. It only uses its constructor, and doesn't
// instantiate or call any methods off of it. So for browsers, we are just gonna
// create a `Buffer` global that maps to a Uint8Array since that is the closest
// browser primitive that matches Buffer
//
// [jest-matcher-utils]:
// https://npmfs.com/package/jest-matcher-utils/26.4.0/build/deepCyclicCopyReplaceable.js#L16

window.Buffer = Uint8Array;
