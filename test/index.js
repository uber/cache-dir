var CacheDir = require('..');
var fs = require('fs');
var mutate = require('../lib/mutate');
var path = require('path');
var exec = require('child_process').exec;
var test = require('tape');

test('clear', function (assert) {
    exec('rm -rf ' + path.join(__dirname, 'cacheTest'), function() {
        assert.end();
    });
});

function createCache() {
    return new CacheDir({
        dir: __dirname,
        namespace: 'cacheTest'
    });
}

function makePath(key) {
    return key ? path.join(__dirname, 'cacheTest', key) : path.join(__dirname, 'cacheTest');
}

test('initialize', function (assert) {
    assert.plan(3);
    assert.ok(!fs.existsSync(makePath()), 'cache directory does not yet exist');
    var cache = createCache();
    assert.ok(fs.existsSync(makePath()), 'auto-created the directory');
    assert.equal(cache.lazy, false, 'greedy by default');
    assert.end();
});

test('setSync', function (assert) {
    assert.plan(2);
    var cache = createCache();
    cache.setSync('foo', 'bar');
    assert.ok(fs.existsSync(makePath('foo')), 'key written to disk');
    assert.equal(JSON.parse(fs.readFileSync(makePath('foo'), 'utf8')), cache.cache.foo, 'written value matches memory');
    assert.end();
});

test('set', function (assert) {
    assert.plan(2);
    var cache = createCache();
    cache.set('foo2', 'bar2', function() {
        assert.ok(fs.existsSync(makePath('foo2')), 'key written to disk');
        assert.equal(JSON.parse(fs.readFileSync(makePath('foo2'), 'utf8')), cache.cache.foo2, 'written value matches memory');
        assert.end();
    });
});
    

test('getSync', function (assert) {
    assert.plan(1);
    var cache = createCache();
    var val = cache.getSync('foo');
    assert.equal(val, 'bar', 'got the expected value even from a separate constructor obj');
    assert.end();
});

test('get sync non existent', function (assert) {
    assert.plan(1);
    var cache = createCache();
    var val = cache.getSync('nonexistent');
    assert.equal(val, undefined, 'got the expected undefined value for a nonexistent key');
    assert.end();
});

test('get sync garbled file', function (assert) {
    assert.plan(2);
    var cache = createCache();
    fs.writeFileSync(path.join(__dirname, 'cacheTest', 'garbled'), 'lol{json}');
    var val = cache.getSync('garbled');
    assert.equal(val, undefined, 'garbled data is also returned as undefined');
    assert.ok(!fs.existsSync(path.join(__dirname, 'cacheTest', 'garbled')), 'garbled was deleted');
    assert.end();
});

test('get', function (assert) {
    assert.plan(2);
    var cache = createCache();
    cache.get('foo2', function(err, val) {
        assert.ifError(err, 'should not get an error back');
        assert.equal(val, 'bar2', 'got the expected value from a separate constructor obj');
        assert.end();
    });
});

test('getLazy', function (assert) {
    assert.plan(3);
    var cache = new CacheDir({
        dir: __dirname,
        namespace: 'cacheTest',
        lazy: true
    });
    assert.ok(!cache.cache.foo2, 'key not yet in memory');
    cache.get('foo2', function(err, val) {
        assert.ifError(err, 'should not get an error back');
        assert.equal(val, 'bar2', 'got the expected value even though not originally in memory');
        assert.end();
    });
});

test('get non existent', function (assert) {
    assert.plan(2);
    var cache = createCache();
    cache.get('nonexistent', function(err, result) {
        assert.ifError(err, 'got no error');
        assert.equal(result, undefined, 'got no result');
        assert.end();
    });
});

test('get garbled', function (assert) {
    assert.plan(3);
    var cache = createCache();
    fs.writeFileSync(path.join(__dirname, 'cacheTest', 'garbled'), 'lol{json}');
    cache.get('garbled', function(err, result) {
        assert.ifError(err, 'got no error');
        assert.equal(result, undefined, 'got no data for the garbled file');
        assert.ok(!fs.existsSync(path.join(__dirname, 'cacheTest', 'garbled')), 'garbled was deleted');
        assert.end();
    });
});

test('get fs failure', mutate(fs, 'readFile', function (source, mode, callback) {
    callback(new Error('fake error'));
}, function (assert) {
    assert.plan(2);
    var cache = new CacheDir({
        dir: __dirname,
        namespace: 'cacheTest',
        lazy: true
    });
    cache.get('foo2', function(err) {
        assert.ok(err instanceof Error, 'got an error back');
        assert.equal(err.message, 'fake error', 'got the fake fs.readFile error back');
        assert.end();
    });
}));

test('keys sync', function (assert) {
    assert.plan(1);
    var cache = createCache();
    assert.deepEqual(cache.keysSync().sort(), ['foo', 'foo2'], 'got both keys');
    assert.end();
});

test('keys', function (assert) {
    assert.plan(1);
    var cache = createCache();
    cache.keys(function(err, keys) {
        assert.deepEqual(keys.sort(), ['foo', 'foo2'], 'got both keys');
        assert.end();
    });
});

test('valuesSync', function (assert) {
    assert.plan(1);
    var cache = createCache();
    assert.deepEqual(cache.valuesSync().sort(), ['bar', 'bar2'], 'got both values');
    assert.end();
});

test('values', function (assert) {
    assert.plan(1);
    var cache = createCache();
    cache.values(function(err, values) {
        assert.deepEqual(values.sort(), ['bar', 'bar2'], 'got both values');
        assert.end();
    });
});

test('valuesReaddirFailure', mutate(fs, 'readdir', function(path, callback) {
    callback(new Error('lol readdir failed somehow'));
}, function(assert) {
    assert.plan(2);
    var cache = createCache();
    cache.values(function(err) {
        assert.ok(err instanceof Error, 'got an error back');
        assert.equal(err.message, 'lol readdir failed somehow', 'got my fake readdir error back');
        assert.end();
    });
}));

test('valuesReadFileFailure', mutate(fs, 'readFile', function(path, mode, callback) {
    callback(new Error('lol readFile also failed'));
}, function(assert) {
    assert.plan(2);
    var cache = new CacheDir({
        dir: __dirname,
        namespace: 'cacheTest',
        lazy: true
    });
    cache.values(function(err) {
        assert.ok(err instanceof Error, 'got an error back');
        assert.equal(err.message, 'lol readFile also failed', 'got my fake readFile error back');
        assert.end();
    });
}));

test('has', function(assert) {
    assert.plan(2);
    var cache = createCache();
    cache.has('foo', function(has) {
        assert.equal(has, true, 'has that key');
        cache.has('lolno', function(has) {
            assert.equal(has, false, 'does not have that key');
            assert.end();
        });
    });
});

test('hasSync', function(assert) {
    assert.plan(2);
    var cache = createCache();
    assert.equal(cache.hasSync('foo'), true, 'has that key');
    assert.equal(cache.hasSync('lolno'), false, 'does not have that key');
    assert.end();
});

test('clearAgain', function (assert) {
    exec('rm -rf ' + path.join(__dirname, 'cacheTest'), function() {
        assert.end();
    });
});
