import { match as findMatch, type MatchedRoute } from './match.ts'
import { createHistory, type Mode } from './history.ts'
import { qs as defaultQs, type Qs } from './qs.ts'

export interface RouterOptions {
  mode?: Mode
  qs?: Qs
  sync?: boolean
}

export interface MatcherOptions {
  qs?: Qs
}

export interface Route<Data = Record<string, unknown>> extends MatchedRoute {
  data: RouteData<Data>[]
}

export interface NavigateTarget {
  url?: string
  pathname?: string
  params?: Record<string, string | number>
  query?: Record<string, unknown> | null
  hash?: string | null
  replace?: boolean
  merge?: boolean
}

export type To = string | NavigateTarget

export type Redirect<Data = Record<string, unknown>> = To | ((route: Route<Data>) => To)

export type RouteData<Data = Record<string, unknown>> = Data & {
  path?: string
  redirect?: Redirect<Data>
}

export type RouteDefinition<Data = Record<string, unknown>> = RouteData<Data> & {
  routes?: RouteDefinition<Data>[]
}

export interface Router<Data = Record<string, unknown>> {
  listen(routes: RouteDefinition<Data>[], onChange?: (route: Route<Data>) => void): () => void
  navigate(to: To, curr?: Route<Data>): void
  href(to: To, curr?: Route<Data>): string
  match(url: string): Route<Data> | undefined
  getUrl(): string
}

export interface Matcher<Data = Record<string, unknown>> {
  match(url: string | undefined): Route<Data> | undefined
}

interface FlatRoute<Data = Record<string, unknown>> {
  pattern: string
  data: RouteData<Data>[]
}

const PARAM_RE = /:([A-Za-z0-9_]+)([+*?])?/g
const MAX_REDIRECTS = 10

export function createRouter<Data = Record<string, unknown>>(options: RouterOptions = {}): Router<Data> {
  const mode = options.mode || 'history'
  const qs = options.qs || defaultQs
  const sync = options.sync || false
  const history = createHistory({ mode, sync })

  let matcher = createMatcher<Data>([], { qs })

  const router: Router<Data> = {
    listen(routeMap, cb) {
      matcher = createMatcher(routeMap, { qs })
      let redirects = 0
      return history.listen((url) => {
        const route = matcher.match(url)
        if (!route) {
          redirects = 0
          return
        }
        for (const r of route.data as Array<{ redirect?: Redirect<Data> }>) {
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
      const target: NavigateTarget = typeof to === 'string' ? { url: to } : to
      const url = router.href(target, curr)
      if (target.replace) {
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

      let target: NavigateTarget = to
      if (target.merge) {
        const c = curr || router.match(router.getUrl())
        target = merge(c, target)
      }

      let url = target.pathname || '/'

      if (target.params) {
        const params = target.params
        url = url.replace(PARAM_RE, (m, name: string, flag: string | undefined) => {
          const v = params[name]
          if (v == null) return m
          if (flag === '+' || flag === '*') {
            return String(v).split('/').map(encodeURIComponent).join('/')
          }
          return encodeURIComponent(String(v))
        })
      }

      if (target.query && Object.keys(target.query).length) {
        const query = qs.stringify(target.query)
        if (query) {
          url = url + '?' + query
        }
      }

      if (target.hash) {
        const prefix = target.hash.startsWith('#') ? '' : '#'
        url = url + prefix + target.hash
      }

      return url
    },

    match(url) {
      return matcher.match(url)
    },

    getUrl() {
      return history.getUrl()
    },
  }

  return router
}

export function createMatcher<Data = Record<string, unknown>>(
  routeMap: RouteDefinition<Data>[],
  options: MatcherOptions = {},
): Matcher<Data> {
  const routes = flatten(routeMap)
  const qs = options.qs || defaultQs

  return {
    match(url) {
      const route = findMatch(routes, url, qs)
      if (route) {
        return { ...route, data: data(routes, route) } as Route<Data>
      }
      return undefined
    },
  }
}

export function flatten<Data = Record<string, unknown>>(routeMap: RouteDefinition<Data>[]): FlatRoute<Data>[] {
  const routes: FlatRoute<Data>[] = []
  const parentData: RouteData<Data>[] = []
  function addLevel(level: RouteDefinition<Data>[]) {
    level.forEach((route) => {
      const {
        path = '',
        routes: children,
        ...routeData
      } = route as RouteDefinition<Data> & {
        path?: string
        routes?: RouteDefinition<Data>[]
      }
      const segment = { path, ...routeData } as RouteData<Data>
      routes.push({ pattern: path, data: parentData.concat([segment]) })
      if (children) {
        parentData.push(segment)
        addLevel(children)
        parentData.pop()
      }
    })
  }
  addLevel(routeMap)
  return routes
}

function data<Data = Record<string, unknown>>(routes: FlatRoute<Data>[], matchingRoute: { pattern: string }) {
  for (let i = 0; i < routes.length; i++) {
    if (routes[i].pattern === matchingRoute.pattern) {
      return routes[i].data
    }
  }
  return []
}

export function merge(curr: Partial<Route> | NavigateTarget | undefined, to: NavigateTarget): NavigateTarget {
  const c = (curr || {}) as Partial<Route> & NavigateTarget
  const pathname = to.pathname || c.pattern || c.pathname
  const params = Object.assign({}, c.params, to.params)
  const query = to.query === null ? null : Object.assign({}, c.query, to.query)
  const hash = to.hash === null ? null : to.hash || c.hash || ''
  return { pathname, params, query, hash }
}
