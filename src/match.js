const { exec } = require('./pattern')

const search = /(?:\?([^#]*))?(#.*)?$/

module.exports = function match(routes, url, qs) {
  if (!url) return
  for (let i = 0; i < routes.length; i++) {
    const route = routes[i]
    const pathname = url.replace(search, '')
    const params = exec(pathname, route.re)
    if (params) {
      const [, query, hash] = url.match(search) || []
      return {
        pattern: route.pattern,
        href: url,
        pathname,
        params,
        query: query ? qs.parse(query) : {},
        hash: hash || ''
      }
    }
  }
}
