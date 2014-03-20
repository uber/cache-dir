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
            this.getSync(file);
        }.bind(this));
    }
}

CacheDir.prototype.setSync = function(key, val) {
    this.cache[key] = val;
    fs.writeFileSync(path.join(this.dir, this.namespace, key), JSON.stringify(val));
};

CacheDir.prototype.set = function(key, val, callback) {
    this.cache[key] = val;
    fs.writeFile(path.join(this.dir, this.namespace, key), JSON.stringify(val), callback);
};

CacheDir.prototype.getSync = function(key) {
    if (this.cache.hasOwnProperty(key)) return this.cache[key];
    var source = path.join(this.dir, this.namespace, key);
    if (fs.existsSync(source)) {
        try {
            this.cache[key] = JSON.parse(fs.readFileSync(source, 'utf8'));
        } catch (e) {
            fs.unlinkSync(source);
        }
    }
    return this.cache[key];
};

CacheDir.prototype.get = function(key, callback) {
    if (this.cache.hasOwnProperty(key)) return process.nextTick(callback.bind(this, null, this.cache[key]));
    var source = path.join(this.dir, this.namespace, key);
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

CacheDir.prototype.keysSync = function() {
    return Object.keys(this.cache);
};

CacheDir.prototype.keys = function(callback) {
    fs.readdir(path.join(this.dir, this.namespace), callback);
};

CacheDir.prototype.valuesSync = function() {
    return Object.keys(this.cache).map(function(key) { return this.cache[key]; }.bind(this));
};

CacheDir.prototype.values = function(callback) {
    fs.readdir(path.join(this.dir, this.namespace), function(err, keys) {
        if (err) return callback(err);
        async.map(keys, function(key, next) {
            fs.readFile(path.join(this.dir, this.namespace, key), 'utf8', function(err, val) {
                if (err) return next(err);
                next(null, JSON.parse(val));
            });
        }.bind(this), callback);
    }.bind(this));
};

// TODO: Add other ES6 Map methods: items, has, forEach, iterator, delete, clear, toString, and the property size

module.exports = CacheDir;