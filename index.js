var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp').sync;
var async = require('async');

function CacheDir(config) {
    this.dir = config.dir;
    this.namespace = config.namespace;
    this.lazy = config.lazy || false;
    this.cache = {};

    var namespacedDir = path.join(this.dir, this.namespace);
    if (!fs.existsSync(namespacedDir)) {
        mkdirp(namespacedDir);
    } else if (!this.lazy) {
        fs.readdirSync(namespacedDir).forEach(function(file) {
            this.cache[file] = JSON.parse(fs.readFileSync(this.keyPath(file), 'utf8'));
        }.bind(this));
    }
}

CacheDir.prototype.keyPath = function(key) {
    return path.join(this.dir, this.namespace, key);
};

CacheDir.prototype.set = function(key, val, callback) {
    this.cache[key] = val;
    fs.writeFile(this.keyPath(key), JSON.stringify(val), callback);
};

CacheDir.prototype.getLocal = function(key) {
    return this.cache[key];
};

CacheDir.prototype.get = function(key, callback) {
    if (this.cache.hasOwnProperty(key)) return process.nextTick(callback.bind(this, null, this.cache[key]));
    var source = this.keyPath(key);
    fs.exists(source, function(exists) {
        if (!exists) return callback();
        fs.readFile(source, 'utf8', function(err, result) {
            // Errors with the cache file are ignored, treated as if nothing is cached
            if (err) return callback(err);
            try {
                this.cache[key] = JSON.parse(result);
            } catch (e) {
                return fs.unlink(source, callback);
            }
            callback(null, this.cache[key]);
        }.bind(this));
    }.bind(this));
};

CacheDir.prototype.keysLocal = function() {
    return Object.keys(this.cache);
};

CacheDir.prototype.keys = function(callback) {
    fs.readdir(path.join(this.dir, this.namespace), callback);
};

CacheDir.prototype.valuesLocal = function() {
    return Object.keys(this.cache).map(function(key) { return this.cache[key]; }.bind(this));
};

CacheDir.prototype.values = function(callback) {
    fs.readdir(path.join(this.dir, this.namespace), function(err, keys) {
        if (err) return callback(err);
        async.map(keys, function(key, next) {
            fs.readFile(this.keyPath(key), 'utf8', function(err, val) {
                if (err) return next(err);
                next(null, JSON.parse(val));
            });
        }.bind(this), callback);
    }.bind(this));
};

CacheDir.prototype.has = function(key, callback) {
    if (this.cache.hasOwnProperty(key)) {
        process.nextTick(callback.bind(this, true));
    } else {
        fs.exists(this.keyPath(key), callback);
    }
};

CacheDir.prototype.hasLocal = function(key) {
    return this.cache.hasOwnProperty(key);
};

// TODO: Add other ES6 Map methods: items, forEach, iterator, delete, clear, toString, and the property size

module.exports = CacheDir;