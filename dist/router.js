import { match as findMatch } from "./match.js";
import { createHistory } from "./history.js";
import { qs as defaultQs } from "./qs.js";
const PARAM_RE = /:([A-Za-z0-9_]+)([+*?])?/g;
const MAX_REDIRECTS = 10;
export function createRouter(options = {}) {
    const mode = options.mode || 'history';
    const qs = options.qs || defaultQs;
    const sync = options.sync || false;
    const history = createHistory({ mode, sync });
    let matcher = createMatcher([], { qs });
    const router = {
        listen(routeMap, cb) {
            matcher = createMatcher(routeMap, { qs });
            let redirects = 0;
            return history.listen((url) => {
                const route = matcher.match(url);
                if (!route) {
                    redirects = 0;
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
                    cb(route);
            });
        },
        navigate(to, curr) {
            const target = typeof to === 'string' ? { url: to } : to;
            const url = router.href(target, curr);
            if (target.replace) {
                history.replace(url);
            }
            else {
                history.push(url);
            }
        },
        href(to, curr) {
            // already a url
            if (typeof to === 'string') {
                return to;
            }
            // align with navigate API
            if (to.url) {
                return to.url;
            }
            let target = to;
            if (target.merge) {
                const c = curr || router.match(router.getUrl());
                target = merge(c, target);
            }
            let url = target.pathname || '/';
            if (target.params) {
                const params = target.params;
                url = url.replace(PARAM_RE, (m, name, flag) => {
                    const v = params[name];
                    if (v == null)
                        return m;
                    if (flag === '+' || flag === '*') {
                        return String(v).split('/').map(encodeURIComponent).join('/');
                    }
                    return encodeURIComponent(String(v));
                });
            }
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
            return url;
        },
        match(url) {
            return matcher.match(url);
        },
        getUrl() {
            return history.getUrl();
        },
    };
    return router;
}
export function createMatcher(routeMap, options = {}) {
    const routes = flatten(routeMap);
    const qs = options.qs || defaultQs;
    return {
        match(url) {
            const route = findMatch(routes, url, qs);
            if (route) {
                return { ...route, data: data(routes, route) };
            }
            return undefined;
        },
    };
}
export function flatten(routeMap) {
    const routes = [];
    const parentData = [];
    function addLevel(level) {
        level.forEach((route) => {
            const { path = '', routes: children, ...routeData } = route;
            const segment = { path, ...routeData };
            routes.push({ pattern: path, data: parentData.concat([segment]) });
            if (children) {
                parentData.push(segment);
                addLevel(children);
                parentData.pop();
            }
        });
    }
    addLevel(routeMap);
    return routes;
}
function data(routes, matchingRoute) {
    for (let i = 0; i < routes.length; i++) {
        if (routes[i].pattern === matchingRoute.pattern) {
            return routes[i].data;
        }
    }
    return [];
}
export function merge(curr, to) {
    const c = (curr || {});
    const pathname = to.pathname || c.pattern || c.pathname;
    const params = Object.assign({}, c.params, to.params);
    const query = to.query === null ? null : Object.assign({}, c.query, to.query);
    const hash = to.hash === null ? null : to.hash || c.hash || '';
    return { pathname, params, query, hash };
}
