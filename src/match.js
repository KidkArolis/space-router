var qs = require('./qs')

var EMPTY = {}

module.exports = match
module.exports.matchOne = matchOne

function match (routes, url) {
  if (!url) return
  for (var i = 0; i < routes.length; i++) {
    var m = matchOne(routes[i].pattern, url)
    if (m) {
      return { route: m, data: routes[i].data }
    }
  }
}

function matchOne (pattern, url) {
  if (!pattern) return false
  if (pattern === '*') return {}

  var search = /(?:\?([^#]*))?(#.*)?$/
  var originalUrl = url
  var originalPattern = pattern
  var c = url.match(search)
  var params = {}
  var query = {}
  var hash = ''
  var ret

  if (c && c[1]) {
    query = qs.parse(c[1])
  }

  if (c && c[2]) {
    hash = c[2] || ''
  }

  url = segmentize(url.replace(search, ''))
  pattern = segmentize(pattern || '')
  var max = Math.max(url.length, pattern.length)
  for (var i = 0; i < max; i++) {
    if (pattern[i] && pattern[i].charAt(0) === ':') {
      var param = pattern[i].replace(/(^:|[+*?]+$)/g, '')
      var flags = (pattern[i].match(/[+*?]+$/) || EMPTY)[0] || ''
      var plus = flags.indexOf('+') > -1
      var star = flags.indexOf('*') > -1
      var val = url[i] || ''
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
