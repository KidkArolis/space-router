let EMPTY = {}

module.exports = function match (routes, url) {
  if (!url) return
  for (var i = 0; i < routes.length; i++) {
    if (matchOne(routes[i].pattern, url)) {
      return routes[i]
    }
  }
}

function matchOne (pattern, url) {
  if (!pattern) return false

  let reg = /(?:\?([^#]*))?(#.*)?$/
  let c = pattern.match(reg)
  let matches = {}
  let ret

  if (pattern === '*') return {}

  if (c && c[1]) {
    let p = c[1].split('&')
    for (let i = 0; i < p.length; i++) {
      let r = p[i].split('=')
      matches[decodeURIComponent(r[0])] = decodeURIComponent(r.slice(1).join('='))
    }
  }

  pattern = segmentize(pattern.replace(reg, ''))
  url = segmentize(url || '')
  let max = Math.max(pattern.length, url.length)
  for (let i = 0; i < max; i++) {
    if (url[i] && url[i].charAt(0) === ':') {
      let param = url[i].replace(/(^:|[+*?]+$)/g, '')
      let flags = (url[i].match(/[+*?]+$/) || EMPTY)[0] || ''
      let plus = ~flags.indexOf('+')
      let star = ~flags.indexOf('*')
      let val = pattern[i] || ''
      if (!val && !star && (flags.indexOf('?') < 0 || plus)) {
        ret = false
        break
      }
      matches[param] = decodeURIComponent(val)
      if (plus || star) {
        matches[param] = pattern.slice(i).map(decodeURIComponent).join('/')
        break
      }
    } else if (url[i] !== pattern[i]) {
      ret = false
      break
    }
  }
  if (ret === false) return false
  return matches
}

function segmentize (pattern) {
  return strip(pattern).split('/')
}

function strip (pattern) {
  return pattern.replace(/(^\/+|\/+$)/g, '')
}
