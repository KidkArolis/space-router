export const qs = {
    parse(queryString) {
        return queryString.split('&').reduce((acc, pair) => {
            if (!pair)
                return acc;
            const i = pair.indexOf('=');
            const key = decode(i < 0 ? pair : pair.slice(0, i));
            const val = i < 0 ? '' : decode(pair.slice(i + 1));
            acc[key] = val;
            return acc;
        }, {});
    },
    stringify(query) {
        return Object.keys(query)
            .reduce((acc, key) => {
            const value = query[key];
            if (value !== undefined) {
                acc.push(encodeURIComponent(key) + '=' + encodeURIComponent(String(value)));
            }
            return acc;
        }, [])
            .join('&');
    },
};
// malformed percent-encoding (e.g. '%zz' typed into the address bar) must
// not crash the router — fall back to the raw value
function decode(s) {
    const raw = s.replace(/\+/g, ' ');
    try {
        return decodeURIComponent(raw);
    }
    catch {
        return raw;
    }
}
