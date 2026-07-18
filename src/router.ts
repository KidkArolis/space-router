import { matchOne, type MatchedRoute } from './match.ts'
import { createHistory, type Mode, type Schedule } from './history.ts'
import { qs as defaultQs, type Qs } from './qs.ts'

export interface RouterOptions {
  mode?: Mode
  qs?: Qs
  sync?: boolean
  schedule?: Schedule
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
  path: string
  redirect?: Redirect<Data>
}

export type RouteDefinition<Data = Record<string, unknown>> = Data & {
  path?: string
  redirect?: Redirect<Data>
  routes?: RouteDefinition<Data>[]
}

// exactly the fields merge() reads — routes, partial routes, and navigation
// targets all satisfy this structurally
export type From = Pick<NavigateTarget, 'pathname' | 'params' | 'query' | 'hash'> & { pattern?: string }

export interface Router<Data = Record<string, unknown>> {
  listen(routes: RouteDefinition<Data>[], onChange?: (route: Route<Data>) => void): () => void
  navigate(to: To, from?: From): void
  href(to: To, from?: From): string
  match(url: string): Route<Data> | undefined
  getUrl(): string
  /**
   * Replace the current history entry with `url`, using mode-appropriate
   * mechanics, WITHOUT emitting a route change. For callers that have
   * already committed a route and only need the address bar to agree —
   * e.g. after a pre-commit transform rewrote the URL.
   */
  replaceUrl(url: string): void
}

export interface Matcher<Data = Record<string, unknown>> {
  match(url: string): Route<Data> | undefined
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
  const history = createHistory({ mode, sync: options.sync, schedule: options.schedule })

  let matcher = createMatcher<Data>([], { qs })

  const router: Router<Data> = {
    listen(routeMap, cb) {
      const previousMatcher = matcher
      const nextMatcher = createMatcher(routeMap, { qs })
      let redirects = 0

      // Install before listening so a synchronous initial redirect can use
      // router.match(), but roll back if history rejects the subscription.
      matcher = nextMatcher
      try {
        return history.listen((url) => {
          const route = nextMatcher.match(url)
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
      } catch (error) {
        matcher = previousMatcher
        throw error
      }
    },

    navigate(to, from) {
      const target: NavigateTarget = typeof to === 'string' ? { url: to } : to
      const url = router.href(target, from)
      if (target.replace) {
        history.replace(url)
      } else {
        history.push(url)
      }
    },

    href(to, from) {
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
        target = merge(from || router.match(router.getUrl()), target)
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

    replaceUrl(url) {
      history.replaceSilent(url)
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
      if (!url) return undefined
      for (const route of routes) {
        const m = matchOne(route.pattern, url, qs)
        if (m) {
          return { ...m, data: route.data }
        }
      }
      return undefined
    },
  }
}

export function flatten<Data = Record<string, unknown>>(routeMap: RouteDefinition<Data>[]): FlatRoute<Data>[] {
  const routes: FlatRoute<Data>[] = []

  function addLevel(level: RouteDefinition<Data>[], parents: RouteData<Data>[]) {
    level.forEach((route) => {
      // the casts are the accepted price of the flat `Data &` route shape —
      // TS can't rest-destructure a generic intersection. Before "fixing"
      // this by nesting user data under a `meta` field, read AGENTS.md.
      const {
        path = '',
        routes: children,
        ...routeData
      } = route as RouteDefinition<Data> & {
        path?: string
        routes?: RouteDefinition<Data>[]
      }
      const segment = { path, ...routeData } as RouteData<Data>
      const branch = [...parents, segment]

      // pathless routes only contribute data to their children — they have
      // no pattern of their own to match
      if (path) {
        routes.push({ pattern: path, data: branch })
      }
      if (children) {
        addLevel(children, branch)
      }
    })
  }

  addLevel(routeMap, [])
  return routes
}

export function merge(from: From | undefined, to: NavigateTarget): NavigateTarget {
  const c: From = from || {}
  const pathname = to.pathname || c.pattern || c.pathname
  const params = Object.assign({}, c.params, to.params)
  const query = to.query === null ? null : Object.assign({}, c.query, to.query)
  const hash = to.hash === null ? null : to.hash || c.hash || ''
  return { pathname, params, query, hash }
}
