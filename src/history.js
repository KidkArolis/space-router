export function createHistory(onChange, options) {
  const sync = options.sync
  let mode = options.mode
  let raf

  const memory = []
  let off
  let destroyed = false

  if (typeof window === 'undefined') {
    mode = 'memory'
    raf = sync ? (cb) => cb() : setImmediate
  } else {
    raf = sync ? (cb) => cb() : requestAnimationFrame
    if (mode === 'history' && !history.pushState) {
      mode = 'hash'
    }
  }

  if (mode !== 'memory') {
    off = on(window, mode === 'history' ? 'popstate' : 'hashchange', onPop)
  }

  function onPop() {
    onChange(getUrl())
  }

  if (mode !== 'memory') {
    onChange(getUrl())
  }

  return {
    getUrl,
    push(url) {
      go(url)
    },
    replace(url) {
      go(url, true)
    },
    destroy() {
      destroyed = true
      off && off()
    },
  }

  function go(url, replace) {
    if (destroyed) return
    url = url.replace(/^\/?#?\/?/, '/').replace(/\/$/, '') || '/'
    if (mode === 'history') {
      history[replace ? 'replaceState' : 'pushState']({}, '', url)
      raf(onPop)
    } else if (mode === 'hash') {
      location[replace ? 'replace' : 'assign']('#' + url)
    } else if (mode === 'memory') {
      replace ? (memory[memory.length - 1] = url) : memory.push(url)
      raf(onPop)
    }
  }

  function getUrl() {
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

  // Gets the true hash value. Cannot use location.hash directly due to bug
  // in Firefox where location.hash will always be decoded.
  function getHash() {
    const match = location.href.match(/#(.*)$/)
    return match ? match[1].replace('#', '') : ''
  }
}

function on(el, type, fn) {
  el.addEventListener(type, fn, false)
  return function off() {
    el.removeEventListener(type, fn, false)
  }
}
