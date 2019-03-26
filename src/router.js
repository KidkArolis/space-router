const matcher = require('./match')
const flatten = require('./flatten')
const createHistory = require('./history')
const defaultQs = require('./qs')
const links = require('./links')

const defaultMode = 'history'

module.exports = function createRouter(options = {}) {
  let onTransition
  let history
  let unintercept
  let routes = []
  let mode = options.mode || defaultMode
  let qs = options.qs || defaultQs
  let intercept = options.intercept

  function transition() {
    const m = router.match(history.url())
    m && onTransition(m)
  }

  function match(url) {
    return matcher(routes, url, qs)
  }

  // TODO, merge inside href()
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
      qs = options.qs || defaultQs
      const nextMode = options.mode || defaultMode
      if (intercept !== options.intercept) {
        intercept = options.intercept
        if (intercept) unintercept = links.intercept()
      }
      if (mode !== nextMode) {
        mode = nextMode
        history && history.stop()
        history = createHistory({ mode }, transition)
      }
      return router
    },

    map(nextRoutes) {
      routes = flatten(nextRoutes)
      return router
    },

    listen(onTransitionFn) {
      onTransition = onTransitionFn
      history = createHistory({ mode }, transition)
      if (intercept) unintercept = links.intercept()
      transition()
      return router
    },

    stop() {
      history && history.stop()
      unintercept && unintercept()
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

    href(options = {}) {
      if (options.url) return options.url

      let url = options.pathname

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
