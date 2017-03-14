var qs = require('./qs')

var EMPTY = {}

module.exports = match
module.exports.matchOne = matchOne

function match (routes, url) {
  if (!url) return
  for (var i = 0; i < routes.length; i++) {
    const m = matchOne(routes[i].pattern, url)
    if (m) {
      return { route: m, data: routes[i].data }
    }
  }
}

function matchOne (pattern, url) {
  if (!pattern) return false
  if (pattern === '*') return {}

  let search = /(?:\?([^#]*))?(#.*)?$/
  let originalUrl = url
  let originalPattern = pattern
  let c = url.match(search)
  let params = {}
  let query = {}
  let hash = ''
  let ret

  if (c && c[1]) {
    query = qs.parse(c[1])
  }

  if (c && c[2]) {
    hash = c[2] || ''
  }

  url = segmentize(url.replace(search, ''))
  pattern = segmentize(pattern || '')
  let max = Math.max(url.length, pattern.length)
  for (let i = 0; i < max; i++) {
    if (pattern[i] && pattern[i].charAt(0) === ':') {
      let param = pattern[i].replace(/(^:|[+*?]+$)/g, '')
      let flags = (pattern[i].match(/[+*?]+$/) || EMPTY)[0] || ''
      let plus = flags.indexOf('+') > -1
      let star = flags.indexOf('*') > -1
      let val = url[i] || ''
      if (!val && !star && (flags.indexOf('?') < 0 || plus)) {
        ret = false
        break
      }
      params[param] = decodeURIComponent(val)
      if (plus || star) {
        params[param] = url.slice(i).map(decodeURIComponent).join('/')
        break
      }
    } else if (pattern[i] !== url[i]) {
      ret = false
      break
    }
  }
  if (ret === false) return false

  return {
    pattern: originalPattern,
    path: originalUrl,
    pathname: originalUrl.replace(search, ''),
    params: params,
    query: query,
    hash: hash
  }
}

function segmentize (url) {
  return strip(url).split('/')
}

function strip (url) {
  return url.replace(/(^\/+|\/+$)/g, '')
}
