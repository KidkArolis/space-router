## 0.7.0

* **Improvement** - Add `replace(url, options)` in addition to `push`, because it matches the DOM API closer and the names are semantically meaningful.
* **Improvement** - Add `set(options)`, which unlike `push/replace`, can be used to only update specific bits of the url, e.g. `set({ query: { a: 1 } })` would add a=1 into the query string in addition to what's already there. Set `query` or `hash` to `null` to clear them.
* **Improvement** - Add `match(url)`, which matches the provided url against the route config and returns `{ route, data }`, useful in Server Side Rendering.
* **Breaking change** - remove `route.path` in favor of the new `route.href`.

## 0.6.0

* **Improvement** - Add `route.href` in favor of `route.path`, which was too close to `route.pathname` and therefore confusing.
