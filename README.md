# cache-dir

An ES6 map-like cache with file-based backing

## Example

```js
var CacheDir = require("cache-dir");

var cache = new CacheDir({
    dir: '/path/to/store/cache',
    namespace: 'dirNameForThisParticularCache',
    lazy: true // Lazy load or eagerly load from disk on startup, eager by default
});

cache.setSync('foo', 'bar'); // This actually blocks on the fs write
cache.getSync('foo'); // returns bar

cache.set('foo2', 'bar2', function(err) {
    console.log("This doesn't block the event loop on the write");
    console.log("And the callback is optional, so you don't need to check " + err && err.message);
});

cache.get('foo2', function(err, val) {
    console.log(val, 'contains "bar2"');
});

cache.keysSync(); // Returns an array of keys
cache.keys(function(err, keys) {
    console.log("also returns an array of keys");
});

cache.valuesSync(); // Returns an array of values
cache.values(function(err, values) {
    console.log("also returns an array of values");
});
```

[Other ES6 Map methods and properties](http://wiki.ecmascript.org/doku.php?id=harmony:simple_maps_and_sets) are not yet implemented.

## Installation

`npm install cache-dir`

## Tests

`npm test`

## Contributors

 - David Ellis
