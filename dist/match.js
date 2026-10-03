export function matchOne(pattern, url, qs) {
    if (!pattern)
        return;
    const re = /(?:\?([^#]*))?(#.*)?$/;
    const c = url.match(re);
    const pathname = url.replace(re, '');
    const params = {};
    if (pattern !== '*') {
        const urlSegs = segmentize(pathname);
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
        pattern,
        url,
        pathname,
        params,
        query: c?.[1] && qs ? qs.parse(c[1]) : {},
        search: c?.[1] ? '?' + c[1] : '',
        hash: c?.[2] || '',
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
