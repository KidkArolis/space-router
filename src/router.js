var match = require('./match')
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

  var currentRoute

  function shouldIntercept (url) {
    return match(routes, url, qs)
  }

  function onClick (e, url) {
    e.preventDefault()
    history.push(url)
  }

  function transition () {
    var route = match(routes, history.url(), qs)
    currentRoute = route
    route && onTransition(route, router.data(route.pattern))
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

    set: function (options) {
      options = options || {}
      var current = currentRoute
      var params = Object.assign({}, current.params, options.params)
      var query = Object.assign({}, current.query, options.query)
      var hash = options.hash || current.hash || ''

      var nextHref = router.href(current.pattern, { params, query, hash })
      history.push(nextHref, options)
    },

    href: function (pattern, options) {
      if (options && options.query) {
        return pattern + '?' + qs.stringify(options.query)
      }
      return pattern
    }
  }

  return router
}
