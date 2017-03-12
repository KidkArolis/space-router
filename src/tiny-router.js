var match = require('./match')
var links = require('./links')
var flatten = require('./flatten')
var createHistory = require('./history')

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
    onChange(curr)
  }

  var router = {
    current: function () {
      return match(routes, history.url())
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

    isActive: function (url, options) {

    },

    href: function (pattern, options) {

    }
  }

  return router
}
