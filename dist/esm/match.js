export function match(routes, url, qs) {
    if (!url) {
        return;
    }
    for(var i = 0; i < routes.length; i++){
        var m = matchOne(routes[i].pattern, url, qs);
        if (m) {
            return m;
        }
    }
}
export function matchOne(pattern, url, qs) {
    if (!pattern) {
        return false;
    }
    var re = /(?:\?([^#]*))?(#.*)?$/;
    var originalUrl = url;
    var originalPattern = pattern;
    var c = url.match(re);
    var params = {};
    var query = {};
    var search = "";
    var hash = "";
    var ret;
    if (c && c[1]) {
        search = "?" + c[1];
        query = qs.parse(c[1]);
    }
    if (c && c[2]) {
        hash = c[2] || "";
    }
    if (pattern !== "*") {
        url = segmentize(url.replace(re, ""));
        pattern = segmentize(pattern || "");
        var max = Math.max(url.length, pattern.length);
        for(var i = 0; i < max; i++){
            if (pattern[i] && pattern[i].charAt(0) === ":") {
                var param = pattern[i].replace(/(^:|[+*?]+$)/g, "");
                var flags = (pattern[i].match(/[+*?]+$/) || {})[0] || "";
                var plus = flags.indexOf("+") > -1;
                var star = flags.indexOf("*") > -1;
                var val = url[i] || "";
                if (!val && !star && (flags.indexOf("?") < 0 || plus)) {
                    ret = false;
                    break;
                }
                params[param] = decodeURIComponent(val);
                if (plus || star) {
                    params[param] = url.slice(i).map(decodeURIComponent).join("/");
                    break;
                }
            } else if (pattern[i] !== url[i]) {
                ret = false;
                break;
            }
        }
        if (ret === false) {
            return false;
        }
    }
    return {
        pattern: originalPattern,
        url: originalUrl,
        pathname: originalUrl.replace(re, ""),
        params: params,
        query: query,
        search: search,
        hash: hash
    };
}
function segmentize(url) {
    return strip(url).split("/");
}
function strip(url) {
    return url.replace(/(^\/+|\/+$)/g, "");
}
