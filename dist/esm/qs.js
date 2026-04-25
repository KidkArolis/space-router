export var qs = {
    parse: function parse(queryString) {
        return queryString.split('&').reduce(function(acc, pair) {
            if (!pair) return acc;
            var i = pair.indexOf('=');
            var key = decode(i < 0 ? pair : pair.slice(0, i));
            var val = i < 0 ? '' : decode(pair.slice(i + 1));
            acc[key] = val;
            return acc;
        }, {});
    },
    stringify: function stringify(query) {
        return Object.keys(query).reduce(function(acc, key) {
            if (query[key] !== undefined) {
                acc.push(encodeURIComponent(key) + '=' + encodeURIComponent(query[key]));
            }
            return acc;
        }, []).join('&');
    }
};
function decode(s) {
    return decodeURIComponent(s.replace(/\+/g, ' '));
}
