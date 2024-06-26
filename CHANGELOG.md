## 0.9.3

- Upgrade all depedencies.

## 0.9.2

- Upgrade all depedencies.

## 0.9.1

- Revert to commonjs (remove `type: "module"`) to keep support for cjs in node and esm in browsers.

## 0.9.0

- Upgrade all dependencies.
- Switch from babel to swc for dist compilation.

## 0.8.5

- fix redirects - the history was not ready by the time initial transition was kicked off by redirecting
- remove the possibility to pass the current route via the `merge` option directly, instead set `merge: true` (truthy value works now), and instead optionally pass the current route as the second argument to `navigate(to, curr)` or `href(to, curr)`, this is a breaking change, but also an undocumented API as it it's still being refined and is used for correctly merging urls during async navigations.

## 0.8.4

- fix the `navigate(url: string)` implementation where `"".replace` was being tested instead of `to.replace`

## 0.8.3

- re-introduce `navigate(url: string)` since it's nice and convenient

## 0.8.2

- refer to `setImmediate` via `global.setImmediate` to fix a webpack compilation error

## 0.8.1

- allow passing current route as `merge` value to opt out of using current url and using an externally passed in route, useful in async context where reading current URL might not be safe

## 0.8.0

A rewrite of space-router. It's better now!

- less methods (only `listen`, `navigate`, `match`, `href` and `getUrl`)
- simpler function signatures and simpler listen callback - you just get the route, not route+data
- improved route config format with objects (`path`, `redirect`, `routes`) instead of arrays
- redirects feature
- new docs at [https://kidkarolis.github.io/space-router/](https://kidkarolis.github.io/space-router/)

All in all - it's a new API, but it's spiritually very much the same and is the best version of Space Router yet!

## 0.7.0

- **Improvement** - Add `replace(url, options)` in addition to `push`, because it matches the DOM API closer and the names are semantically meaningful.
- **Improvement** - Add `set(options)`, which unlike `push/replace`, can be used to only update specific bits of the url, e.g. `set({ query: { a: 1 } })` would add a=1 into the query string in addition to what's already there. Set `query` or `hash` to `null` to clear them.
- **Improvement** - Add `match(url)`, which matches the provided url against the route config and returns `{ route, data }`, useful in Server Side Rendering.
- **Breaking change** - remove `route.path` in favor of the new `route.href`.

## 0.6.0

- **Improvement** - Add `route.href` in favor of `route.path`, which was too close to `route.pathname` and therefore confusing.
