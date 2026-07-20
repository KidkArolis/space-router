import { matchOne } from './match.js';
import { createHistory, normalizeRouteUrl } from './history.js';
import { qs as defaultQs } from './qs.js';
const PARAM_RE = /\/:([A-Za-z0-9_]+)([+*?])?/g;
const PROTOCOL_RE = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;
const MAX_REDIRECTS = 10;
function browserHref(href, mode) {
    if (PROTOCOL_RE.test(href))
        return href;
    if (mode === 'hash') {
        if (href.startsWith('#/'))
            return '#' + normalizeRouteUrl(href.slice(1));
        if (href.startsWith('#'))
            return href;
        return '#' + normalizeRouteUrl(href);
    }
    return href.startsWith('#') ? href : normalizeRouteUrl(href);
}
export function createRouter(options = {}) {
    const mode = options.mode || 'history';
    const qs = options.qs || defaultQs;
    const history = createHistory({ mode, sync: options.sync, schedule: options.schedule });
    let matcher = createMatcher([], { qs });
    const router = {
        listen(routeMap, cb) {
            const previousMatcher = matcher;
            const nextMatcher = createMatcher(routeMap, { qs });
            let redirects = 0;
            // Install before listening so a synchronous initial redirect can use
            // router.match(), but roll back if history rejects the subscription.
            matcher = nextMatcher;
            try {
                return history.listen((url, info) => {
                    const route = nextMatcher.match(url);
                    if (!route) {
                        redirects = 0;
                        if (cb)
                            cb(undefined, info);
                        return;
                    }
                    for (const r of route.data) {
                        if (r.redirect) {
                            if (++redirects > MAX_REDIRECTS) {
                                redirects = 0;
                                throw new Error('space-router: too many redirects');
                            }
                            const target = typeof r.redirect === 'function' ? r.redirect(route) : r.redirect;
                            return router.navigate({ url: router.href(target), replace: true });
                        }
                    }
                    redirects = 0;
                    if (cb)
                        cb(route, info);
                });
            }
            catch (error) {
                matcher = previousMatcher;
                throw error;
            }
        },
        navigate(to, from) {
            const target = typeof to === 'string' ? { url: to } : to;
            const href = router.href(target, from);
            const url = router.routeUrl(href) ?? href;
            if (target.replace) {
                history.replace(url);
            }
            else {
                history.push(url);
            }
        },
        href(to, from) {
            if (typeof to === 'string') {
                return browserHref(to, mode);
            }
            if (to.url) {
                return browserHref(to.url, mode);
            }
            let target = to;
            if (target.merge) {
                target = merge(from || router.match(router.getUrl()), target);
            }
            let url = target.pathname || '/';
            url = url.replace(PARAM_RE, (m, name, flag) => {
                const v = target.params?.[name];
                // ? and * mean the segment may be absent — drop it (and its slash)
                // when unfilled; an unfilled required param stays literal, loudly
                if (v == null || v === '') {
                    return flag === '?' || flag === '*' ? '' : m;
                }
                if (flag === '+' || flag === '*') {
                    return '/' + String(v).split('/').map(encodeURIComponent).join('/');
                }
                return '/' + encodeURIComponent(String(v));
            });
            if (!url)
                url = '/';
            if (target.query && Object.keys(target.query).length) {
                const query = qs.stringify(target.query);
                if (query) {
                    url = url + '?' + query;
                }
            }
            if (target.hash) {
                const prefix = target.hash.startsWith('#') ? '' : '#';
                url = url + prefix + target.hash;
            }
            return browserHref(url, mode);
        },
        routeUrl(href) {
            if (PROTOCOL_RE.test(href))
                return null;
            if (mode === 'hash')
                return href.startsWith('#/') ? normalizeRouteUrl(href.slice(1)) : null;
            if (href.startsWith('#'))
                return null;
            return normalizeRouteUrl(href);
        },
        match(url) {
            return matcher.match(url);
        },
        getUrl() {
            return history.getUrl();
        },
        replaceUrl(url) {
            history.replaceSilent(url);
        },
    };
    return router;
}
export function createMatcher(routeMap, options = {}) {
    const routes = flatten(routeMap);
    const qs = options.qs || defaultQs;
    return {
        match(url) {
            if (!url)
                return undefined;
            for (const route of routes) {
                const m = matchOne(route.pattern, url, qs);
                if (m) {
                    return { ...m, data: route.data };
                }
            }
            return undefined;
        },
    };
}
export function flatten(routeMap) {
    const routes = [];
    function addLevel(level, parents) {
        level.forEach((route) => {
            // the casts are the accepted price of the flat `Data &` route shape —
            // TS can't rest-destructure a generic intersection. Before "fixing"
            // this by nesting user data under a `meta` field, read AGENTS.md.
            const { path = '', routes: children, ...routeData } = route;
            const segment = { path, ...routeData };
            const branch = [...parents, segment];
            // pathless routes only contribute data to their children — they have
            // no pattern of their own to match
            if (path) {
                routes.push({ pattern: path, data: branch });
            }
            if (children) {
                addLevel(children, branch);
            }
        });
    }
    addLevel(routeMap, []);
    return routes;
}
export function merge(from, to) {
    const c = from || {};
    const pathname = to.pathname || c.pattern || c.pathname;
    const params = Object.assign({}, c.params, to.params);
    const query = to.query === null ? null : Object.assign({}, c.query, to.query);
    const hash = to.hash === null ? null : to.hash || c.hash || '';
    return { pathname, params, query, hash };
}
