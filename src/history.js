export function createHistory(options = {}) {
  const sync = options.sync
  let mode = options.mode || 'history'
  let raf
  let listener

  const memory = []

  if (typeof window === 'undefined') {
    mode = 'memory'
    raf = sync ? (cb) => cb() : global.setImmediate
  } else {
    raf = sync ? (cb) => cb() : requestAnimationFrame
    if (mode === 'history' && !history.pushState) {
      mode = 'hash'
    }
  }

  function emit() {
    if (listener) listener(getUrl())
  }

  function listen(onChange) {
    if (listener) throw new Error('Already listening')
    listener = onChange
    let off
    if (mode !== 'memory') {
      off = on(window, mode === 'history' ? 'popstate' : 'hashchange', emit)
      raf(emit)
    }
    return () => {
      listener = null
      if (off) off()
    }
  }

  function go(url, replace) {
    url = url.replace(/^\/?#?\/?/, '/').replace(/\/$/, '') || '/'
    if (mode === 'history') {
      history[replace ? 'replaceState' : 'pushState']({}, '', url)
      raf(emit)
    } else if (mode === 'hash') {
      location[replace ? 'replace' : 'assign']('#' + url)
    } else if (mode === 'memory') {
      if (replace) {
        memory[memory.length - 1] = url
      } else {
        memory.push(url)
      }
      raf(emit)
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
    return match ? match[1] : ''
  }

  return {
    listen,
    getUrl,
    push(url) {
      go(url)
    },
    replace(url) {
      go(url, true)
    },
  }
}

function on(el, type, fn) {
  el.addEventListener(type, fn, false)
  return function off() {
    el.removeEventListener(type, fn, false)
  }
}
