const matcher = require('./match')
const flatten = require('./flatten')
const createHistory = require('./history')
const defaultQs = require('./qs')
const links = require('./links')

const defaultMode = 'history'

module.exports = function createRouter(options = {}) {
  let onTransition, history, unintercept
  let routes = []
  let mode = options.mode || defaultMode
  let qs = options.qs || defaultQs
  let interceptLinks = options.interceptLinks

  function transition() {
    const m = router.match(history.url())
    m && onTransition(m)
  }

  function match(url) {
    return matcher(routes, url, qs)
  }

  const router = {
    map(nextRoutes) {
      routes = flatten(nextRoutes)
      return router
    },

    listen(onTransitionFn) {
      onTransition = onTransitionFn
      history = createHistory({ mode }, transition)
      if (interceptLinks) unintercept = links.intercept(match, history)
      transition()
      return router
    },

    stop() {
      history && history.stop()
      unintercept && unintercept()
      return router
    },

    push(options) {
      if (typeof options === 'string') {
        history.push(options)
      } else {
        history.push(router.href(options), options)
      }
    },

    data(pattern) {
      for (let i = 0; i < routes.length; i++) {
        if (routes[i].pattern === pattern) {
          return routes[i].data
        }
      }
    },

    match(url) {
      const route = match(url)
      if (route) return { route, data: router.data(route.pattern) }
    },

    href(options = {}, currentUrl) {
      if (options.url) {
        return options.url
      }

      if (options.merge) {
        const current = match(currentUrl || history.url())
        const pathname = options.pathname || options.pattern || current.pattern
        const params = Object.assign({}, current.params, options.params)
        const query = options.query === null ? null : Object.assign({}, current.query, options.query)
        const hash = options.hash === null ? null : options.hash || current.hash || ''
        options = { pathname, params, query, hash }
      }

      let url = options.pathname || options.pattern

      if (options.params) {
        Object.keys(options.params).forEach(param => {
          url = url.replace(':' + param, options.params[param])
        })
      }

      if (options.query && Object.keys(options.query).length) {
        const query = qs.stringify(options.query)
        if (query) {
          url = url + '?' + query
        }
      }

      if (options.hash) {
        url += options.hash
      }

      return url
    }
  }

  return router
}
