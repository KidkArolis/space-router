module.exports = {
  parse(queryString) {
    return queryString.split('&').reduce((acc, pair) => {
      const parts = pair.split('=')
      acc[parts[0]] = decodeURIComponent(parts[1])
      return acc
    }, {})
  },

  stringify(query) {
    return Object.keys(query)
      .reduce((acc, key) => {
        if (query[key] !== undefined) {
          acc.push(key + '=' + encodeURIComponent(query[key]))
        }
        return acc
      }, [])
      .join('&')
  }
}
