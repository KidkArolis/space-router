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
      let url
      let replace = false

      if (to.url) {
        url = to.url
      } else {
        url = router.href(to)
      }
      replace = !!to.replace

      if (replace) {
        history.replace(url)
      } else {
        history.push(url)
      }
    },

    href(to) {
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
        url += to.hash
      }

      return url
    },

    match(url) {
      const route = findMatch(routes, url, qs)
      return { ...route, data: data(routes, route) }
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
        return router.navigate({
          url: typeof r.redirect === 'string' ? r.redirect : router.href(r.redirect),
          replace: true,
        })
      }
    }
    onNavigated && onNavigated(route)
  }
}

function data(routes, { pattern } = {}) {
  if (pattern) {
    for (let i = 0; i < routes.length; i++) {
      if (routes[i].pattern === pattern) {
        return routes[i].data
      }
    }
  }
  return []
}
