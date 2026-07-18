# Notes for future readers (human or otherwise)

## Route metadata is flat — don't nest it under `meta`

User metadata lives directly on route definitions, mixed with the router's own
fields:

```js
{ path: '/shows/:id', component: Show, routes: [...] }
```

If the two `as` casts in `flatten()` bother you: the "obvious fix" — nesting
user data under a `meta` field — was fully built and then reverted before
release. It makes the types sound, but taxes every consumer at their
highest-frequency call site: apps and react-space-router author and read route
fields flat (`segment.component`). `meta: { component: Home }` on every route,
forever, is a worse trade than two casts in library internals.

The accepted price of flat:

- two `as` casts in `flatten()` — TS can't rest-destructure a generic intersection
- heterogeneous route arrays sometimes need an explicit type argument (see flatten tests)
- `path`, `redirect`, and `routes` are reserved names, unavailable as metadata
  keys (like React reserving `key` on props)

If the casts ever truly need to go, constrain the generic
(`Data extends { path?; redirect?; routes? }`) — don't nest the data.

## General bar for changes

The identity is "<2kb, no dependencies, learnable in one sitting". Matching is
definition-order, first-match-wins — deliberate, not legacy; specificity
ranking only pays off when routes compose from multiple sources, which this
router doesn't do. Prefer a line of documentation over a runtime guard, and a
guard over a new layer.
