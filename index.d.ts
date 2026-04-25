export type Mode = 'history' | 'hash' | 'memory'

export interface Qs {
  parse(queryString: string): Record<string, string>
  stringify(query: Record<string, unknown>): string
}

export interface RouterOptions {
  /** URL strategy. Defaults to `history`. Forced to `memory` when there is no `window`. */
  mode?: Mode
  /** Custom query string parser. Defaults to the built-in `qs`. */
  qs?: Qs
  /** Synchronously notify listeners on navigation (skips `requestAnimationFrame`). */
  sync?: boolean
}

export interface Route<Data = Record<string, unknown>> {
  /** The full relative URL the router observed. */
  url: string
  /** The `pathname` portion of the URL, without query or hash. */
  pathname: string
  /** Params extracted from the matched pattern's named segments. */
  params: Record<string, string>
  /** Query parsed via the active `qs.parse`. */
  query: Record<string, string>
  /** Raw query string including the leading `?` (or empty). */
  search: string
  /** Hash fragment including the leading `#` (or empty). */
  hash: string
  /** The pattern that matched, e.g. `/user/:id`. */
  pattern: string
  /** Stack of metadata objects from each matched route level (outermost first). */
  data: Data[]
}

export interface NavigateTarget {
  /** A pre-built URL string. If set, all other fields are ignored. */
  url?: string
  /** Pathname (may include `:name` segments to be filled by `params`). */
  pathname?: string
  /** Values for any `:name` segments in `pathname`. */
  params?: Record<string, string | number>
  /** Query, passed through `qs.stringify`. Pass `null` (with `merge`) to clear. */
  query?: Record<string, unknown> | null
  /** Hash fragment, with or without leading `#`. Pass `null` (with `merge`) to clear. */
  hash?: string | null
  /** Use `replaceState` instead of `pushState`. */
  replace?: boolean
  /** Merge with the current route (params/query/hash carry over unless overridden). */
  merge?: boolean
}

export type To = string | NavigateTarget

export type Redirect<Data = Record<string, unknown>> = To | ((route: Route<Data>) => To)

export type RouteDefinition<Data = Record<string, unknown>> = Data & {
  /** URL pattern, e.g. `/user/:id`, `/files/:path+`, or `*` for a catch-all. */
  path?: string
  /** Redirect target. May be a URL, a `NavigateTarget`, or a function returning one. */
  redirect?: Redirect<Data>
  /** Nested routes (each must define its own full `path`). */
  routes?: RouteDefinition<Data>[]
}

export interface Router<Data = Record<string, unknown>> {
  /** Start listening for URL changes. Returns a dispose function. */
  listen(routes: RouteDefinition<Data>[], onChange?: (route: Route<Data>) => void): () => void
  /** Navigate to a new URL. */
  navigate(to: To, curr?: Route<Data>): void
  /** Build a URL string from a navigation target. */
  href(to: To, curr?: Route<Data>): string
  /** Match a URL against the registered routes. */
  match(url: string): Route<Data> | undefined
  /** Read the current URL (path + search + hash). */
  getUrl(): string
}

export function createRouter<Data = Record<string, unknown>>(options?: RouterOptions): Router<Data>

export function merge(
  curr: Partial<Route> | NavigateTarget | undefined,
  to: NavigateTarget,
): NavigateTarget

export const qs: Qs

export interface History {
  listen(onChange: (url: string) => void): () => void
  getUrl(): string
  push(url: string): void
  replace(url: string): void
}

export function createHistory(options?: { mode?: Mode; sync?: boolean }): History
