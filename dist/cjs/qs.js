"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "qs", {
    enumerable: true,
    get: function() {
        return qs;
    }
});
var qs = {
    parse: function(queryString) {
        return queryString.split("&").reduce(function(acc, pair) {
            var parts = pair.split("=");
            acc[parts[0]] = decodeURIComponent(parts[1]);
            return acc;
        }, {});
    },
    stringify: function(query) {
        return Object.keys(query).reduce(function(acc, key) {
            if (query[key] !== undefined) {
                acc.push(key + "=" + encodeURIComponent(query[key]));
            }
            return acc;
        }, []).join("&");
    }
};
