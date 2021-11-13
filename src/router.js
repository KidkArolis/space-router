import { match as findMatch } from './match'
import { createHistory } from './history'
import { qs as defaultQs } from './qs'

export function createRouter(options = {}) {
  let history = null
  let routes = []
  const mode = options.mode || 'history'
  const qs = options.qs || defaultQs
  const sync = options.sync || false

  const router = {
    listen(routeMap, cb) {
      if (history) {
        throw new Error('Already listening')
      }

      routes = flatten(routeMap)
      const onHistoryChange = (url) => transition(router, url, cb)
      history = createHistory(onHistoryChange, { mode, sync })

      return () => {
        history.destroy()
        history = null
        routes = []
      }
    },

    navigate(to) {
      if (typeof to === 'string') {
        to = { url: to }
      }
      const url = router.href(to)
      if (to.replace) {
        history.replace(url)
      } else {
        history.push(url)
      }
    },

    href(to) {
      // already a url
      if (typeof to === 'string') {
        return to
      }

      // align with navigate API
      if (to.url) {
        return to.url
      }

      if (to.merge) {
        const curr = to.merge === true ? router.match(router.getUrl()) : to.merge
        to = merge(curr, to)
      }

      let url = to.pathname || '/'

      if (to.params) {
        Object.keys(to.params).forEach((param) => {
          url = url.replace(':' + param, to.params[param])
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

function transition(router, url, onNavigated) {
  const route = router.match(url)
  if (route) {
    for (const r of route.data) {
      if (r.redirect) {
        const url = redirectUrl(router, r.redirect, route)
        return router.navigate({ url, replace: true })
      }
    }
    onNavigated && onNavigated(route)
  }
}

function redirectUrl(router, redirect, matchingRoute) {
  if (typeof redirect === 'function') {
    redirect = redirect(matchingRoute)
  }
  return router.href(redirect)
}

function data(routes, matchingRoute) {
  for (let i = 0; i < routes.length; i++) {
    if (routes[i].pattern === matchingRoute.pattern) {
      return routes[i].data
    }
  }
}

export function merge(curr = {}, to) {
  const pathname = to.pathname || curr.pattern
  const params = Object.assign({}, curr.params, to.params)
  const query = to.query === null ? null : Object.assign({}, curr.query, to.query)
  const hash = to.hash === null ? null : to.hash || curr.hash || ''
  return { pathname, params, query, hash }
}
