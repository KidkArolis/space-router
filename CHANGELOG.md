## 1.4.1

- tighten the `From` type (types-only, no runtime change): it now lists exactly the fields `merge` reads — `{ pathname?, params?, query?, hash?, pattern? }` — instead of `Partial<Route> | NavigateTarget`. Routes, partial routes, and stored navigation targets all still satisfy it structurally. `From` also loses its never-load-bearing type parameter, so a `From<X>` annotation written against 1.4.0 becomes `From`.

## 1.4.0

- `navigate(to, from)` and `href(to, from)` now correctly accept partial routes and navigation targets in their public TypeScript signatures (the new `From` type, pairing with `To`), matching their existing runtime behavior. The second argument was previously documented as `curr` — same position, same runtime behavior, clearer name.
- history subscriptions now have identity-owned, idempotent disposers. A stale disposer cannot remove a newer listener, pending emissions are invalidated on disposal, failed initial delivery cleans up transactionally, and a rejected second router listener no longer replaces the active matcher.
- malformed percent-encoding in a url (e.g. a hand-typed `/foo%zz`) no longer throws from `match` and `qs.parse` — the affected param or query value falls back to its raw, undecoded form.

## 1.3.0

- add `router.replaceUrl(url)` — replace the current history entry with a url, using mode-appropriate mechanics, without emitting a route change. For callers that have already committed a route and only need the address bar to agree, e.g. after a pre-commit transform rewrote the url. Backed by a new `history.replaceSilent(url)` on `createHistory`.

## 1.2.0

- add a `schedule(fire, info)` option to `createRouter` and `createHistory` for controlling how url changes are delivered to the listener. `info.traversal` is true for back/forward traversals (`popstate`/`hashchange`), false for programmatic navigations and the initial `listen` call. `sync: true` is now shorthand for the immediate scheduler `(fire) => fire()`; an explicit `schedule` takes precedence.
- internal emit coalescing now uses a sequence guard: superseded emits no-op and the surviving one reads the url at fire time, so mixed schedules (e.g. a deferred traversal emit racing a push's microtask emit) collapse to a single emit of the final url.

## 1.1.0

- add `createMatcher(routes, options?)` for matching urls against a route map without creating a router — useful for matching before (or without) subscribing to url changes with `listen`, for example in server side rendering or tests.
- each entry in a matched route's `data` array now includes the `path` it was declared with.
- `getUrl()` in memory mode now returns `''` instead of `undefined` before any navigation.

## 1.0.0

A TypeScript rewrite, ESM-only output, and a batch of correctness fixes.

- source migrated to TypeScript; type declarations ship with the package, with a generic `Data` parameter on `Route`, `Router` and `RouteDefinition`.
- ESM only. The cjs output is dropped and `node >= 18` is required.
- fix `href`: encode param values, strip flag suffixes (`?`, `+`, `*`), and handle params whose names share a prefix. URLs now round-trip through `match` for values containing `/`, spaces, or other special characters.
- fix `qs.parse`: decode keys, preserve `=` in values, treat `+` as space. `qs.stringify` encodes keys.
- cap redirect chains at 10 hops with a clear error instead of a stack overflow.
- `getUrl` and `navigate` are safe to call before `listen` and after dispose.
- hash mode now fires the listener when navigating to the current URL, matching history mode.
- internal scheduling moved to `queueMicrotask` with coalescing — rapid navigations collapse to a single emit and listeners fire regardless of tab visibility.
- `matchOne` returns `undefined` instead of `false` when there's no match (only relevant if you import it directly).
- `getHash` no longer strips `#` characters from inside the hash fragment.
- drop the IE9-era `pushState` feature detect.

## 0.9.5

- Upgrade all depedencies.

## 0.9.4

- Upgrade all depedencies.

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
