import { match as findMatch } from './match'
import { createHistory } from './history'
import { qs as defaultQs } from './qs'

const PARAM_RE = /:([A-Za-z0-9_]+)([+*?])?/g
const MAX_REDIRECTS = 10

export function createRouter(options = {}) {
  const mode = options.mode || 'history'
  const qs = options.qs || defaultQs
  const sync = options.sync || false
  const history = createHistory({ mode, sync })

  let routes = []

  const router = {
    listen(routeMap, cb) {
      routes = flatten(routeMap)
      let redirects = 0
      return history.listen((url) => {
        const route = router.match(url)
        if (!route) {
          redirects = 0
          return
        }
        for (const r of route.data) {
          if (r.redirect) {
            if (++redirects > MAX_REDIRECTS) {
              redirects = 0
              throw new Error('space-router: too many redirects')
            }
            const target = typeof r.redirect === 'function' ? r.redirect(route) : r.redirect
            return router.navigate({ url: router.href(target), replace: true })
          }
        }
        redirects = 0
        if (cb) cb(route)
      })
    },

    navigate(to, curr) {
      if (typeof to === 'string') {
        to = { url: to }
      }
      const url = router.href(to, curr)
      if (to.replace) {
        history.replace(url)
      } else {
        history.push(url)
      }
    },

    href(to, curr) {
      // already a url
      if (typeof to === 'string') {
        return to
      }

      // align with navigate API
      if (to.url) {
        return to.url
      }

      if (to.merge) {
        curr = curr || router.match(router.getUrl())
        to = merge(curr, to)
      }

      let url = to.pathname || '/'

      if (to.params) {
        const params = to.params
        url = url.replace(PARAM_RE, (m, name, flag) => {
          const v = params[name]
          if (v == null) return m
          if (flag === '+' || flag === '*') {
            return String(v).split('/').map(encodeURIComponent).join('/')
          }
          return encodeURIComponent(v)
        })
      }

      if (to.query && Object.keys(to.query).length) {
        const query = qs.stringify(to.query)
        if (query) {
          url = url + '?' + query
        }
      }

      if (to.hash) {
        const prefix = to.hash.startsWith('#') ? '' : '#'
        url = url + prefix + to.hash
      }

      return url
    },

    match(url) {
      const route = findMatch(routes, url, qs)
      if (route) {
        return { ...route, data: data(routes, route) }
      }
    },

    getUrl() {
      return history.getUrl()
    },
  }

  return router
}

export function flatten(routeMap) {
  const routes = []
  const parentData = []
  function addLevel(level) {
    level.forEach((route) => {
      const { path = '', routes: children, ...routeData } = route
      routes.push({ pattern: path, data: parentData.concat([routeData]) })
      if (children) {
        parentData.push(routeData)
        addLevel(children)
        parentData.pop()
      }
    })
  }
  addLevel(routeMap)
  return routes
}

function data(routes, matchingRoute) {
  for (let i = 0; i < routes.length; i++) {
    if (routes[i].pattern === matchingRoute.pattern) {
      return routes[i].data
    }
  }
}

export function merge(curr = {}, to) {
  const pathname = to.pathname || curr.pattern || curr.pathname
  const params = Object.assign({}, curr.params, to.params)
  const query = to.query === null ? null : Object.assign({}, curr.query, to.query)
  const hash = to.hash === null ? null : to.hash || curr.hash || ''
  return { pathname, params, query, hash }
}
