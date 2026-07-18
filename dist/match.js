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
                params[param] = decode(val);
                if (plus || star) {
                    params[param] = urlSegs.slice(i).map(decode).join('/');
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
// malformed percent-encoding (e.g. '%zz' typed into the address bar) must
// not crash the router — fall back to the raw segment
function decode(s) {
    try {
        return decodeURIComponent(s);
    }
    catch {
        return s;
    }
}
function segmentize(url) {
    return strip(url).split('/');
}
function strip(url) {
    return url.replace(/(^\/+|\/+$)/g, '');
}
