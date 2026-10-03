export function createHistory(options = {}) {
    const schedule = options.schedule || (options.sync ? (fire) => fire() : (fire) => queueMicrotask(fire));
    let mode = options.mode || 'history';
    let active;
    let seq = 0;
    const memory = [];
    if (typeof window === 'undefined') {
        mode = 'memory';
    }
    function emit(info) {
        active?.listener(getUrl(), info);
    }
    // each scheduled fire captures its seq: superseded fires no-op, and the
    // surviving one reads the url fresh in emit() — so racing schedules of any
    // mix (e.g. a deferred traversal emit overtaken by a push's microtask emit)
    // coalesce into a single emit of the final url
    function scheduleEmit(traversal) {
        const s = ++seq;
        const info = { traversal };
        schedule(() => {
            if (s === seq)
                emit(info);
        }, info);
    }
    function listen(onChange) {
        if (active)
            throw new Error('Already listening');
        const subscription = { listener: onChange };
        active = subscription;
        const dispose = () => {
            if (active !== subscription)
                return;
            active = undefined;
            seq++;
            subscription.off?.();
        };
        try {
            if (mode !== 'memory') {
                subscription.hashUrl = location.href;
                subscription.off = on(window, mode === 'history' ? 'popstate' : 'hashchange', (event) => {
                    if (mode === 'hash') {
                        const url = event.newURL;
                        // Hash writes are synchronous, but events arrive in later tasks.
                        // Ignore superseded URLs and changes already observed by a write
                        // or this subscription's initial emit (including old queued events).
                        if (url !== location.href || url === subscription.hashUrl)
                            return;
                        subscription.hashUrl = url;
                    }
                    scheduleEmit(true);
                });
                scheduleEmit(false);
            }
        }
        catch (error) {
            dispose();
            throw error;
        }
        return dispose;
    }
    function go(url, replace) {
        url = normalizeRouteUrl(url);
        if (mode === 'history') {
            history[replace ? 'replaceState' : 'pushState']({}, '', url);
            scheduleEmit(false);
        }
        else if (mode === 'hash') {
            location[replace ? 'replace' : 'assign']('#' + url);
            if (active)
                active.hashUrl = location.href;
            scheduleEmit(false);
        }
        else if (mode === 'memory') {
            if (replace && memory.length) {
                memory[memory.length - 1] = url;
            }
            else {
                memory.push(url);
            }
            scheduleEmit(false);
        }
    }
    function getUrl() {
        if (mode === 'memory') {
            return memory[memory.length - 1] ?? '';
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
    // replace the current entry without emitting — for callers that have
    // already committed a route and only need the url to agree. replaceState
    // fires no popstate/hashchange, so no emit needs suppressing; in hash mode
    // this is also why we can't reuse go()'s location.replace path, which does
    // fire hashchange and would emit.
    function replaceSilent(url) {
        url = normalizeRouteUrl(url);
        if (mode === 'history') {
            history.replaceState({}, '', url);
        }
        else if (mode === 'hash') {
            // a bare fragment url leaves the page's pathname and search untouched
            history.replaceState({}, '', '#' + url);
            if (active)
                active.hashUrl = location.href;
        }
        else if (mode === 'memory') {
            if (memory.length) {
                memory[memory.length - 1] = url;
            }
            else {
                memory.push(url);
            }
        }
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
        replaceSilent,
    };
}
export function normalizeRouteUrl(url) {
    url = url.replace(/^\/?(?:#\/)?/, '/');
    const suffixIndex = url.search(/[?#]/);
    const pathname = suffixIndex < 0 ? url : url.slice(0, suffixIndex);
    const suffix = suffixIndex < 0 ? '' : url.slice(suffixIndex);
    return (pathname.replace(/\/$/, '') || '/') + suffix;
}
function on(el, type, fn) {
    el.addEventListener(type, fn, false);
    return function off() {
        el.removeEventListener(type, fn, false);
    };
}
