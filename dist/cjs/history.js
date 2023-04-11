"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "createHistory", {
    enumerable: true,
    get: function() {
        return createHistory;
    }
});
function createHistory(options) {
    var listen = function listen(onChange) {
        onPop = function() {
            return onChange(getUrl());
        };
        if (mode !== "memory") {
            off = on(window, mode === "history" ? "popstate" : "hashchange", onPop);
            raf(onPop);
        }
        return function() {
            destroyed = true;
            off && off();
        };
    };
    var go = function go(url, replace) {
        if (destroyed) return;
        url = url.replace(/^\/?#?\/?/, "/").replace(/\/$/, "") || "/";
        if (mode === "history") {
            history[replace ? "replaceState" : "pushState"]({}, "", url);
            raf(onPop);
        } else if (mode === "hash") {
            location[replace ? "replace" : "assign"]("#" + url);
        } else if (mode === "memory") {
            replace ? memory[memory.length - 1] = url : memory.push(url);
            raf(onPop);
        }
    };
    var getUrl = function getUrl() {
        if (mode === "memory") {
            return memory[memory.length - 1];
        }
        var hash = getHash();
        if (mode === "hash") {
            return hash === "" ? "/" : hash;
        }
        if (mode === "history") {
            var url = location.pathname + location.search;
            if (hash !== "") {
                url += "#" + hash;
            }
            return url;
        }
    };
    var getHash = // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    function getHash() {
        var match = location.href.match(/#(.*)$/);
        return match ? match[1].replace("#", "") : "";
    };
    var sync = options.sync;
    var mode = options.mode;
    var raf;
    var onPop;
    var memory = [];
    var off;
    var destroyed = false;
    if (typeof window === "undefined") {
        mode = "memory";
        raf = sync ? function(cb) {
            return cb();
        } : global.setImmediate;
    } else {
        raf = sync ? function(cb) {
            return cb();
        } : requestAnimationFrame;
        if (mode === "history" && !history.pushState) {
            mode = "hash";
        }
    }
    return {
        listen: listen,
        getUrl: getUrl,
        push: function(url) {
            go(url);
        },
        replace: function(url) {
            go(url, true);
        }
    };
}
function on(el, type, fn) {
    el.addEventListener(type, fn, false);
    return function off() {
        el.removeEventListener(type, fn, false);
    };
}
