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
        return createRouter;
    },
    flatten: function() {
        return flatten;
    },
    merge: function() {
        return merge;
    }
});
var _match = require("./match");
var _history = require("./history");
var _qs = require("./qs");
function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
function _object_spread(target) {
    for(var i = 1; i < arguments.length; i++){
        var source = arguments[i] != null ? arguments[i] : {};
        var ownKeys = Object.keys(source);
        if (typeof Object.getOwnPropertySymbols === "function") {
            ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function(sym) {
                return Object.getOwnPropertyDescriptor(source, sym).enumerable;
            }));
        }
        ownKeys.forEach(function(key) {
            _define_property(target, key, source[key]);
        });
    }
    return target;
}
function ownKeys(object, enumerableOnly) {
    var keys = Object.keys(object);
    if (Object.getOwnPropertySymbols) {
        var symbols = Object.getOwnPropertySymbols(object);
        if (enumerableOnly) {
            symbols = symbols.filter(function(sym) {
                return Object.getOwnPropertyDescriptor(object, sym).enumerable;
            });
        }
        keys.push.apply(keys, symbols);
    }
    return keys;
}
function _object_spread_props(target, source) {
    source = source != null ? source : {};
    if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
        ownKeys(Object(source)).forEach(function(key) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
    }
    return target;
}
function _object_without_properties(source, excluded) {
    if (source == null) return {};
    var target = _object_without_properties_loose(source, excluded);
    var key, i;
    if (Object.getOwnPropertySymbols) {
        var sourceSymbolKeys = Object.getOwnPropertySymbols(source);
        for(i = 0; i < sourceSymbolKeys.length; i++){
            key = sourceSymbolKeys[i];
            if (excluded.indexOf(key) >= 0) continue;
            if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue;
            target[key] = source[key];
        }
    }
    return target;
}
function _object_without_properties_loose(source, excluded) {
    if (source == null) return {};
    var target = {};
    var sourceKeys = Object.keys(source);
    var key, i;
    for(i = 0; i < sourceKeys.length; i++){
        key = sourceKeys[i];
        if (excluded.indexOf(key) >= 0) continue;
        target[key] = source[key];
    }
    return target;
}
function createRouter() {
    var options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
    var history = null;
    var routes = [];
    var mode = options.mode || "history";
    var qs = options.qs || _qs.qs;
    var sync = options.sync || false;
    var router = {
        listen: function(routeMap, cb) {
            if (history) {
                throw new Error("Already listening");
            }
            routes = flatten(routeMap);
            history = (0, _history.createHistory)({
                mode: mode,
                sync: sync
            });
            var dispose = history.listen(function(url) {
                return transition(router, url, cb);
            });
            return function() {
                dispose();
                history = null;
                routes = [];
            };
        },
        navigate: function(to, curr) {
            if (typeof to === "string") {
                to = {
                    url: to
                };
            }
            var url = router.href(to, curr);
            if (to.replace) {
                history.replace(url);
            } else {
                history.push(url);
            }
        },
        href: function(to, curr) {
            // already a url
            if (typeof to === "string") {
                return to;
            }
            // align with navigate API
            if (to.url) {
                return to.url;
            }
            if (to.merge) {
                curr = curr || router.match(router.getUrl());
                to = merge(curr, to);
            }
            var url = to.pathname || "/";
            if (to.params) {
                Object.keys(to.params).forEach(function(param) {
                    url = url.replace(":" + param, to.params[param]);
                });
            }
            if (to.query && Object.keys(to.query).length) {
                var query = qs.stringify(to.query);
                if (query) {
                    url = url + "?" + query;
                }
            }
            if (to.hash) {
                var prefix = to.hash.startsWith("#") ? "" : "#";
                url = url + prefix + to.hash;
            }
            return url;
        },
        match: function(url) {
            var route = (0, _match.match)(routes, url, qs);
            if (route) {
                return _object_spread_props(_object_spread({}, route), {
                    data: data(routes, route)
                });
            }
        },
        getUrl: function() {
            return history.getUrl();
        }
    };
    return router;
}
function flatten(routeMap) {
    var routes = [];
    var parentData = [];
    function addLevel(level) {
        level.forEach(function(route) {
            var _route_path = route.path, path = _route_path === void 0 ? "" : _route_path, children = route.routes, routeData = _object_without_properties(route, [
                "path",
                "routes"
            ]);
            routes.push({
                pattern: path,
                data: parentData.concat([
                    routeData
                ])
            });
            if (children) {
                parentData.push(routeData);
                addLevel(children);
                parentData.pop();
            }
        });
    }
    addLevel(routeMap);
    return routes;
}
function transition(router, url, onNavigated) {
    var route = router.match(url);
    if (route) {
        var _iteratorNormalCompletion = true, _didIteratorError = false, _iteratorError = undefined;
        try {
            for(var _iterator = route.data[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true){
                var r = _step.value;
                if (r.redirect) {
                    var _$url = redirectUrl(router, r.redirect, route);
                    return router.navigate({
                        url: _$url,
                        replace: true
                    });
                }
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally{
            try {
                if (!_iteratorNormalCompletion && _iterator.return != null) {
                    _iterator.return();
                }
            } finally{
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
        onNavigated && onNavigated(route);
    }
}
function redirectUrl(router, redirect, matchingRoute) {
    if (typeof redirect === "function") {
        redirect = redirect(matchingRoute);
    }
    return router.href(redirect);
}
function data(routes, matchingRoute) {
    for(var i = 0; i < routes.length; i++){
        if (routes[i].pattern === matchingRoute.pattern) {
            return routes[i].data;
        }
    }
}
function merge() {
    var curr = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {}, to = arguments.length > 1 ? arguments[1] : void 0;
    var pathname = to.pathname || curr.pattern || curr.pathname;
    var params = Object.assign({}, curr.params, to.params);
    var query = to.query === null ? null : Object.assign({}, curr.query, to.query);
    var hash = to.hash === null ? null : to.hash || curr.hash || "";
    return {
        pathname: pathname,
        params: params,
        query: query,
        hash: hash
    };
}
