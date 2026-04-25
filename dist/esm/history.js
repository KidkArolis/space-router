export function createHistory() {
    var options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    var sync = options.sync;
    var mode = options.mode || 'history';
    var raf;
    var listener;
    var memory = [];
    if (typeof window === 'undefined') {
        mode = 'memory';
        raf = sync ? function(cb) {
            return cb();
        } : global.setImmediate;
    } else {
        raf = sync ? function(cb) {
            return cb();
        } : requestAnimationFrame;
        if (mode === 'history' && !history.pushState) {
            mode = 'hash';
        }
    }
    function emit() {
        if (listener) listener(getUrl());
    }
    function listen(onChange) {
        if (listener) throw new Error('Already listening');
        listener = onChange;
        var off;
        if (mode !== 'memory') {
            off = on(window, mode === 'history' ? 'popstate' : 'hashchange', emit);
            raf(emit);
        }
        return function() {
            listener = null;
            if (off) off();
        };
    }
    function go(url, replace) {
        url = url.replace(/^\/?#?\/?/, '/').replace(/\/$/, '') || '/';
        if (mode === 'history') {
            history[replace ? 'replaceState' : 'pushState']({}, '', url);
            raf(emit);
        } else if (mode === 'hash') {
            location[replace ? 'replace' : 'assign']('#' + url);
        } else if (mode === 'memory') {
            if (replace) {
                memory[memory.length - 1] = url;
            } else {
                memory.push(url);
            }
            raf(emit);
        }
    }
    function getUrl() {
        if (mode === 'memory') {
            return memory[memory.length - 1];
        }
        var hash = getHash();
        if (mode === 'hash') {
            return hash === '' ? '/' : hash;
        }
        if (mode === 'history') {
            var url = location.pathname + location.search;
            if (hash !== '') {
                url += '#' + hash;
            }
            return url;
        }
    }
    // Gets the true hash value. Cannot use location.hash directly due to bug
    // in Firefox where location.hash will always be decoded.
    function getHash() {
        var match = location.href.match(/#(.*)$/);
        return match ? match[1] : '';
    }
    return {
        listen: listen,
        getUrl: getUrl,
        push: function push(url) {
            go(url);
        },
        replace: function replace(url) {
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
