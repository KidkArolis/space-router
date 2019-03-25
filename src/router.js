const matcher = require('./match')
const flatten = require('./flatten')
const createHistory = require('./history')
const defaultQs = require('./qs')

module.exports = function createRouter(options = {}) {
  let onTransition = []
  let history
  let routes = []
  let mode = options.mode || 'history'
  let qs = options.qs || defaultQs

  function transition() {
    const route = match(history.url())
    route && onTransition({ route, data: router.data(route.pattern) })
  }

  function match(url) {
    return matcher(routes, url, qs)
  }

  function merge(current, options) {
    options = options || {}
    const pathname = options.pathname || options.pattern || current.pattern
    const params = Object.assign({}, current.params, options.params)
    const query = options.query === null ? null : Object.assign({}, current.query, options.query)
    const hash = options.hash === null ? null : options.hash || current.hash || ''
    return { pathname, params, query, hash }
  }

  const router = {
    options(options) {
      // TODO - restart history if mode changed
      mode = options.mode || 'history'
      qs = options.qs || defaultQs
      return router
    },

    map(nextRoutes) {
      routes = flatten(nextRoutes)
      return router
    },

    listen(onTransitionFn) {
      onTransition = onTransitionFn
      history = createHistory({ mode }, transition)
      transition()
      return router
    },

    data(pattern) {
      for (let i = 0; i < routes.length; i++) {
        if (routes[i].pattern === pattern) {
          return routes[i].data
        }
      }
    },

    stop() {
      history && history.stop()
      return router
    },

    push(options) {
      if (options.merge) {
        const route = match(history.url())
        options = merge(route, options)
      }
      const url = typeof options === 'string' ? options : router.href(options)
      options = typeof options === 'string' ? {} : options
      history.push(url, options)
    },

    match(url) {
      const route = match(url)
      return { route, data: router.data(route.pattern) }
    },

    href(options = {}) {
      if (options.url) {
        return options.url
      }

      let pattern = options.pathname

      if (options.params) {
        Object.keys(options.params).forEach(param => {
          pattern = pattern.replace(':' + param, options.params[param])
        })
      }

      if (options.query && Object.keys(options.query).length) {
        const query = qs.stringify(options.query)
        if (query) {
          pattern = pattern + '?' + query
        }
      }

      if (options.hash) {
        pattern += options.hash
      }

      return pattern
    }
  }

  return router
}
