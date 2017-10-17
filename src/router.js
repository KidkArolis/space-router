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

  function shouldIntercept (url) {
    return match(routes, url, qs)
  }

  function onClick (e, url) {
    e.preventDefault()
    history.push(url)
  }

  function transition () {
    var route = match(routes, history.url(), qs)
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

    href: function (pattern, options) {
      if (options && options.query) {
        return pattern + '?' + qs.stringify(options.query)
      }
      return pattern
    }
  }

  return router
}
