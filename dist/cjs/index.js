"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: all[name]
    });
}
_export(exports, {
    createRouter: function() {
        return _router.createRouter;
    },
    merge: function() {
        return _router.merge;
    },
    createHistory: function() {
        return _history.createHistory;
    },
    qs: function() {
        return _qs.qs;
    }
});
var _router = require("./router");
var _history = require("./history");
var _qs = require("./qs");
