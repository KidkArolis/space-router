export const qs = {
    parse(queryString) {
        return Object.fromEntries(new URLSearchParams(queryString));
    },
    stringify(query) {
        const params = new URLSearchParams();
        for (const [key, value] of Object.entries(query)) {
            if (value !== undefined)
                params.append(key, String(value));
        }
        return params.toString();
    },
};
