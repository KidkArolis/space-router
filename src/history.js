var on = require('./on')

module.exports = function createHistory (options, onChange) {
  var mode = options.mode || 'history'
  // var root = clean(options.root || '/')

  var memory = []
  var location = {}
  var history = {}
  var off

  if (typeof window === 'undefined') {
    mode = 'memory'
  } else {
    location = window.location
    history = window.history
    if (mode === 'history' && !history.pushState) {
      mode = 'hash'
    }
  }

  if (mode === 'history') {
    off = on(window, 'popstate', onPop)
  } else if (mode === 'hash') {
    off = on(window, 'hashchange', onPop)
  }

  function onPop () {
    onChange(getUrl())
  }

  return {
    url: function url () {
      return getUrl()
    },

    push: function push (url, options) {
      url = clean(url)
      options = options || {}
      if (mode === 'history') {
        history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url)
        onPop()
      } else if (mode === 'hash') {
        location[options.replace ? 'replace' : 'assign']('#' + url)
      } else if (mode === 'memory') {
        options.replace ? (memory[memory.length - 1] = url) : memory.push(url)
        onPop()
      }
    },

    stop: function stop () {
      off && off()
    }
  }

  function getUrl () {
    if (mode === 'history') return getPath()
    if (mode === 'hash') return getHash().replace('#', '')
    if (mode === 'memory') return memory[memory.length - 1]
  }

  function getPath () {
    return location.pathname + location.search
  }

  // Gets the true hash value. Cannot use location.hash directly due to bug
  // in Firefox where location.hash will always be decoded.
  function getHash () {
    var match = window.location.href.match(/#(.*)$/)
    return match ? match[1] : '/'
  }

  function clean (url) {
    return url.replace(/^\/?#?\/?/, '/').replace(/\/$/, '')
  }
}
