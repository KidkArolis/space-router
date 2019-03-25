const on = require('./on')

module.exports = function createHistory({ mode }, onChange) {
  let memory
  let off
  let af

  if (typeof window === 'undefined') {
    mode = 'memory'
    memory = []
  } else {
    if (mode === 'history' && !history.pushState) {
      mode = 'hash'
    }
    off = on(window, mode === 'history' ? 'popstate' : 'hashchange', onPop)
  }

  function onPop() {
    onChange(url())
  }

  function push(url, options) {
    url = url.replace(/^\/?#?\/?/, '/').replace(/\/$/, '') || '/'
    options = options || {}
    if (mode === 'history') {
      history[options.replace ? 'replaceState' : 'pushState']({}, '', url)
      af = requestAnimationFrame(onPop)
    } else if (mode === 'hash') {
      location[options.replace ? 'replace' : 'assign']('#' + url)
    } else if (mode === 'memory') {
      options.replace ? (memory[memory.length - 1] = url) : memory.push(url)
      onPop()
    }
  }

  function url() {
    if (mode === 'memory') {
      return memory[memory.length - 1]
    }

    const hash = getHash()
    if (mode === 'hash') {
      return hash === '' ? '/' : hash
    }

    if (mode === 'history') {
      let url = location.pathname + location.search
      if (hash !== '') {
        url += '#' + hash
      }
      return url
    }
  }

  function stop() {
    off && off()
    af && cancelAnimationFrame(af)
  }

  // Gets the true hash value. Cannot use location.hash directly due to bug
  // in Firefox where location.hash will always be decoded.
  function getHash() {
    const match = location.href.match(/#(.*)$/)
    return match ? match[1].replace('#', '') : ''
  }

  return { push, url, stop }
}
