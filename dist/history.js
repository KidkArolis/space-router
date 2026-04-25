export function createHistory(options = {}) {
    const sync = options.sync;
    let mode = options.mode || 'history';
    let raf;
    let listener = null;
    const memory = [];
    if (typeof window === 'undefined') {
        mode = 'memory';
        raf = sync ? (cb) => cb() : queueMicrotask;
    }
    else {
        raf = sync ? (cb) => cb() : requestAnimationFrame;
    }
    function emit() {
        if (listener)
            listener(getUrl());
    }
    function listen(onChange) {
        if (listener)
            throw new Error('Already listening');
        listener = onChange;
        let off;
        if (mode !== 'memory') {
            off = on(window, mode === 'history' ? 'popstate' : 'hashchange', emit);
            raf(emit);
        }
        return () => {
            listener = null;
            if (off)
                off();
        };
    }
    function go(url, replace) {
        url = url.replace(/^\/?#?\/?/, '/').replace(/\/$/, '') || '/';
        if (mode === 'history') {
            history[replace ? 'replaceState' : 'pushState']({}, '', url);
            raf(emit);
        }
        else if (mode === 'hash') {
            location[replace ? 'replace' : 'assign']('#' + url);
        }
        else if (mode === 'memory') {
            if (replace) {
                memory[memory.length - 1] = url;
            }
            else {
                memory.push(url);
            }
            raf(emit);
        }
    }
    function getUrl() {
        if (mode === 'memory') {
            return memory[memory.length - 1];
        }
        const hash = getHash();
        if (mode === 'hash') {
            return hash === '' ? '/' : hash;
        }
        let url = location.pathname + location.search;
        if (hash !== '') {
            url += '#' + hash;
        }
        return url;
    }
    function getHash() {
        return location.hash.slice(1);
    }
    return {
        listen,
        getUrl,
        push(url) {
            go(url);
        },
        replace(url) {
            go(url, true);
        },
    };
}
function on(el, type, fn) {
    el.addEventListener(type, fn, false);
    return function off() {
        el.removeEventListener(type, fn, false);
    };
}
