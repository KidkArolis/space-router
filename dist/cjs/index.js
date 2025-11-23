"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get createHistory () {
        return _history.createHistory;
    },
    get createRouter () {
        return _router.createRouter;
    },
    get merge () {
        return _router.merge;
    },
    get qs () {
        return _qs.qs;
    }
});
var _router = require("./router");
var _history = require("./history");
var _qs = require("./qs");
