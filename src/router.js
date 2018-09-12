var matcher = require('./match')
var links = require('./links')
var flatten = require('./flatten')
var createHistory = require('./history')
var defaultQs = require('./qs')

module.exports = function createRouter (routes, options) {
  options = options || {}

  options.mode = options.mode || 'history'
  options.interceptLinks = options.interceptLinks !== false
  routes = flatten(routes)

  var onTransition
  var history
  var qs = options.qs || defaultQs
  var unintercept = options.interceptLinks && links.intercept(shouldIntercept, onClick)

  function shouldIntercept (url) {
    return match(url)
  }

  function onClick (e, url) {
    e.preventDefault()
    history.push(url)
  }

  function transition () {
    var route = match(history.url())
    route && onTransition(route, router.data(route.pattern))
  }

  function match (url) {
    return matcher(routes, url, qs)
  }

  var router = {
    data: function (pattern) {
      for (var i = 0; i < routes.length; i++) {
        if (routes[i].pattern === pattern) {
          return routes[i].data
        }
      }
    },

    start: function (_onTransition) {
      history = createHistory({ mode: options.mode }, transition)
      onTransition = _onTransition
      transition()
      return router
    },

    stop: function () {
      unintercept && unintercept()
      history && history.stop()
    },

    push: function (url, options) {
      history.push(router.href(url, options), options)
    },

    replace: function (url, options) {
      router.push(url, Object.assign({}, options, { replace: true }))
    },

    set: function (options) {
      options = options || {}
      var current = match(history.url())
      var pattern = options.pattern || current.pattern
      var params = Object.assign({}, current.params, options.params)
      var query = options.query === null ? null : Object.assign({}, current.query, options.query)
      var hash = options.hash === null ? null : (options.hash || current.hash || '')

      var nextHref = router.href(pattern, { params: params, query: query, hash: hash })
      history.push(nextHref, options)
    },

    match: function (url) {
      var route = match(url)
      return { route: route, data: router.data(route.pattern) }
    },

    href: function (pattern, options) {
      options = options || {}
      if (options.params) {
        Object.keys(options.params).forEach(function (param) {
          pattern = pattern.replace(':' + param, options.params[param])
        })
      }
      if (options.query && Object.keys(options.query).length) {
        var query = qs.stringify(options.query)
        if (query) {
          pattern = pattern + '?' + query
        }
      }
      if (options.hash) {
        pattern = pattern + options.hash
      }
      return pattern
    }
  }

  return router
}
