export function match(routes, url, qs) {
    if (!url)
        return;
    for (let i = 0; i < routes.length; i++) {
        const m = matchOne(routes[i].pattern, url, qs);
        if (m)
            return m;
    }
}
export function matchOne(pattern, url, qs) {
    if (!pattern)
        return;
    const re = /(?:\?([^#]*))?(#.*)?$/;
    const originalUrl = url;
    const originalPattern = pattern;
    const c = url.match(re);
    const params = {};
    let query = {};
    let search = '';
    let hash = '';
    if (c && c[1]) {
        search = '?' + c[1];
        query = qs ? qs.parse(c[1]) : {};
    }
    if (c && c[2]) {
        hash = c[2];
    }
    if (pattern !== '*') {
        const urlSegs = segmentize(url.replace(re, ''));
        const patSegs = segmentize(pattern);
        const max = Math.max(urlSegs.length, patSegs.length);
        for (let i = 0; i < max; i++) {
            const ps = patSegs[i];
            if (ps && ps.charAt(0) === ':') {
                const param = ps.replace(/(^:|[+*?]+$)/g, '');
                const flags = ps.match(/[+*?]+$/)?.[0] ?? '';
                const plus = flags.indexOf('+') > -1;
                const star = flags.indexOf('*') > -1;
                const val = urlSegs[i] || '';
                if (!val && !star && (flags.indexOf('?') < 0 || plus))
                    return;
                params[param] = decodeURIComponent(val);
                if (plus || star) {
                    params[param] = urlSegs.slice(i).map(decodeURIComponent).join('/');
                    break;
                }
            }
            else if (ps !== urlSegs[i]) {
                return;
            }
        }
    }
    return {
        pattern: originalPattern,
        url: originalUrl,
        pathname: originalUrl.replace(re, ''),
        params,
        query,
        search,
        hash,
    };
}
function segmentize(url) {
    return strip(url).split('/');
}
function strip(url) {
    return url.replace(/(^\/+|\/+$)/g, '');
}
