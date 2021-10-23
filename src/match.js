export function match(routes, url, qs) {
  if (!url) {
    return
  }

  for (let i = 0; i < routes.length; i++) {
    const m = matchOne(routes[i].pattern, url, qs)
    if (m) {
      return m
    }
  }
}

export function matchOne(pattern, url, qs) {
  if (!pattern) {
    return false
  }

  const re = /(?:\?([^#]*))?(#.*)?$/
  const originalUrl = url
  const originalPattern = pattern
  const c = url.match(re)
  const params = {}
  let query = {}
  let search = ''
  let hash = ''
  let ret

  if (c && c[1]) {
    search = '?' + c[1]
    query = qs.parse(c[1])
  }

  if (c && c[2]) {
    hash = c[2] || ''
  }

  if (pattern !== '*') {
    url = segmentize(url.replace(re, ''))
    pattern = segmentize(pattern || '')
    const max = Math.max(url.length, pattern.length)
    for (let i = 0; i < max; i++) {
      if (pattern[i] && pattern[i].charAt(0) === ':') {
        const param = pattern[i].replace(/(^:|[+*?]+$)/g, '')
        const flags = (pattern[i].match(/[+*?]+$/) || {})[0] || ''
        const plus = flags.indexOf('+') > -1
        const star = flags.indexOf('*') > -1
        const val = url[i] || ''
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

    if (ret === false) {
      return false
    }
  }

  return {
    pattern: originalPattern,
    url: originalUrl,
    pathname: originalUrl.replace(re, ''),
    params,
    query,
    search,
    hash,
  }
}

function segmentize(url) {
  return strip(url).split('/')
}

function strip(url) {
  return url.replace(/(^\/+|\/+$)/g, '')
}
