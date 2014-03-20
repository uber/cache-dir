var test = require('tape');

var cacheDir = require('../index.js');

test('cacheDir is a function', function (assert) {
    assert.strictEqual(typeof cacheDir, 'function');
    assert.end();
});
