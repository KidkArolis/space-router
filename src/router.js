var match = require('./match')
var links = require('./links')
var flatten = require('./flatten')
var createHistory = require('./history')
var qs = require('./qs')

module.exports = function createRouter (routes, options) {
  options = options || {}
  routes = flatten(routes)

  var onChange
  var history = createHistory({ mode: 'hash' }, transition)
  var unintercept = links.intercept(shouldIntercept, onClick)

  function shouldIntercept (a) {
    return match(routes, a.getAttribute('href'))
  }

  function onClick (e, a) {
    e.preventDefault()
    history.push(a.getAttribute('href'))
  }

  function transition (url) {
    var curr = router.current()
    if (!curr) return
    onChange && onChange(curr.route, curr.data)
  }

  var router = {
    current: function () {
      return match(routes, history.url())
    },

    data: function (route) {
      if (typeof route !== 'string') {
        route = route.pattern
      }
      for (var i = 0; i < routes.length; i++) {
        if (routes[i].pattern === route) {
          return routes[i].data
        }
      }
    },

    start: function (_onChange) {
      onChange = _onChange
      transition()
      return router
    },

    stop: function () {
      unintercept && unintercept()
      history.stop()
      return router
    },

    push: function (url, options) {
      history.push(url, options)
      return router
    },

    href: function (pattern, options) {
      if (options.query) {
        return pattern + '?' + qs.stringify(options.query)
      }
      return pattern
    }
  }

  return router
}
