module.exports.exec = function exec(path, re) {
  let i = 0
  let out = {}
  let matches = path.match(re.pattern)
  if (!matches) return
  while (i < re.keys.length) {
    const key = re.keys[i++]
    out[key] = matches[i] ? decodeURIComponent(matches[i]) : null
  }
  return out
}

module.exports.compile = function compile(str) {
  let c, o, tmp, ext
  let keys = []
  let pattern = ''
  let arr = str.split('/')
  arr[0] || arr.shift()

  while ((tmp = arr.shift())) {
    c = tmp[0]
    if (c === '*') {
      keys.push('*')
      pattern += '/(.*)'
    } else if (c === ':') {
      if (tmp.indexOf('*') === tmp.length - 1) {
        keys.push(tmp.substr(1, tmp.length - 2))
        pattern += '/(.*)'
      } else {
        o = tmp.indexOf('?', 1)
        ext = tmp.indexOf('.', 1)
        keys.push(tmp.substring(1, ~o ? o : ~ext ? ext : tmp.length))
        pattern += !!~o && !~ext ? '(?:/([^/]+?))?' : '/([^/]+?)'
        if (~ext) pattern += (~o ? '?' : '') + '\\' + tmp.substring(ext)
      }
    } else {
      pattern += '/' + tmp
    }
  }

  return {
    keys: keys,
    pattern: new RegExp('^' + pattern + '/?$', 'i')
  }
}
