module.exports = function mutate(obj, key, val, scope) {
    return function(test) {
        var old = obj[key];
        obj[key] = val;
        var boundTestDone = test.end.bind(test);
        test.end = function() {
            obj[key] = old;
            boundTestDone();
        };
        try {
            scope.apply(this, arguments);
        } catch(e) {
            obj[key] = old;
            throw e;
        }
    };
};
