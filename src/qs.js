export const qs = {
  parse(queryString) {
    return queryString.split('&').reduce((acc, pair) => {
      if (!pair) return acc
      const i = pair.indexOf('=')
      const key = decode(i < 0 ? pair : pair.slice(0, i))
      const val = i < 0 ? '' : decode(pair.slice(i + 1))
      acc[key] = val
      return acc
    }, {})
  },

  stringify(query) {
    return Object.keys(query)
      .reduce((acc, key) => {
        if (query[key] !== undefined) {
          acc.push(encodeURIComponent(key) + '=' + encodeURIComponent(query[key]))
        }
        return acc
      }, [])
      .join('&')
  },
}

function decode(s) {
  return decodeURIComponent(s.replace(/\+/g, ' '))
}
