---
title: 'Space Router'
draft: false
toc: true
---

# Space Router

> Framework agnostic router for single page apps

Space Router packs all the features you need to keep your app in sync with the url. It's distinct from many other routers in that there is only **a single callback**. This callback can be used to re-render your application, update a store and perform other actions on each url change. Space Router is **stateless**, it doesn't store the current route leaving state completely up to you to handle.

In summary, Space Router:

- listens to url changes using popstate or hashchange event
- extracts url parameters and parses query strings
- supports nested routes and arbitrary route metadata
- fits into a wide range of application architectures and frameworks
- ships TypeScript types
- has no dependencies and weighs less than 2kb

## Why?

Space Router was first created in 2017 to create a minimal library after learning from the various routing approaches used in Backbone, Ember and then React eras. Each new framework brought new requirements for a router, but each new router had a core that was very similar – listening to url changes, parsing url params and queries, performing navigations and generating links. Space Router was created as a framework agnostic router that should be easy enough to use standalone _or_ to built on top of to create more sophisticated bindings for specific frameworks or applications architectures.

What about [remix-run/history](https://github.com/remix-run/history/)? History wraps the history API only. Space Router takes a more holistic approach with handling url and query parsing and declaring and matching route configurations to create a fully usable standalone router. It doesn't have all the bells of whistles of the `history` package, but if you need them - use that instead.

See [React Space Router](https://humaans.github.io/react-space-router) for the official React bindings that provide a set of hooks and components to make space router a fully featured routing library for React.

## Install

```sh
npm i space-router
```

## Example

```js
import Preact from 'preact'
import { createRouter } from 'space-router'
import { App, Home, Shows, Show, ShowSettings, NotFound } from './components'

// define your routes as a nested array of routes
const routes = [
  {
    component: App,
    routes: [
      { path: '/', component: Home },
      { path: '/shows', component: Shows },
      {
        path: '/shows/:id',
        component: Show,
        routes: [{ path: '/shows/:id/settings', component: ShowSettings }],
      },
    ],
  },
  { path: '*', component: NotFound },
]

// create the router
const router = createRouter()

// start listening to the url changes and kick of the initial render
// based on the current url
export const dispose = router.listen(routes, render)

// every time the route changes, do something, e.g. re-render your app
// or implement more complex behaviours, such as fetching route components,
// route data, updating a store and so on, bind this to your application
// the way it makes sense for your framework and architecture
function render(route) {
  // using reduceRight here to take the list of the nested components
  // e.g. App > Home and render then right to left inside each other
  const app = route.data.reduceRight((children, d) => {
    const { component: Component } = d
    return <Component params={route.params}>{children}</Component>
  }, null)
  Preact.render(app, document.body, document.body.lastElementChild)
}
```

## API

### `createRouter`

```js
const router = createRouter(options)
```

Create the router object.

- `options` object
  - `mode` - one of `history`, `hash`, `memory`, default is `history`. `memory` is used automatically when there is no `window`, e.g. on the server
  - `qs` - a custom query string parser, an object of shape `{ parse, stringify }`
  - `sync` - set to true to deliver url changes to the listener synchronously. By default changes are coalesced and delivered in a microtask, so rapid successive navigations produce a single listener call. Shorthand for `schedule: (fire) => fire()`
  - `schedule` - a function `(fire, info) => void` controlling how url changes are delivered to the listener. Call `fire()` to deliver the change — the scheduler must eventually call it, but may defer it however it likes, e.g. `(fire) => setTimeout(fire, 0)`. `info.traversal` is true when the change was triggered by a back/forward traversal (`popstate` or `hashchange`), false for programmatic navigations and the initial `listen` call. Calling a superseded `fire` is harmless — only the latest scheduled change is delivered, and it reads the url at fire time. Takes precedence over `sync` when both are set. Default: `(fire) => queueMicrotask(fire)`

### `listen`

```js
const dispose = router.listen(routes, onChange)
```

Start listening to url changes. Every time the url changes via back/forward button or by performing programmatic navigations, the `onChange` callback will get called with the matched `route` object.

Note, calling listen will right away call `onChange` based on the current url when in `history` or `hash` modes — delivered via the scheduler, so in a microtask by default, or synchronously with `sync: true`. This does not happen in `memory` mode so that you could perform the initial navigation yourself since there is no url to read from in that case.

- `routes` an array of route definitions, where each route is an object of shape `{ path, redirect, routes, ...metadata }`
  - `path` is the url pattern to match that can include named parameters as segments — see [Patterns](#patterns)
  - `redirect` can be a string, a `to` object, or a function `(route) => to` that redirects upon entering that route. Cyclic redirects are capped (an error is thrown after 10 hops)
  - `routes` is a nested array of nested route definitions
  - `...metadata` any other keys can be chosen by you
- `onChange` is called with the `route` object

`route` is an object of shape `{ url, pathname, params, query, search, hash, pattern, data }`:

- `url` full relative url string including query string and hash if any
- `pathname` the pathname portion of the target url, which can include named segments
- `params` params extracted from the named pathname segments
- `query` query object that was parsed with `qs.parse`
- `search` full unparsed query string
- `hash` hash fragment
- `pattern` the matched route pattern as defined in the route config
- `data` an array of the matched route's metadata, one entry per nesting level. Each entry includes the `path` it was declared with along with any metadata you defined

Listen returns a `dispose` function that stops listening to url changes.

### Patterns

Route `path` patterns support named segments and a few flag suffixes:

- `:name` — a required segment. `/user/:id` matches `/user/7` with `params: { id: '7' }`.
- `:name?` — an optional segment. `/user/:id?` matches both `/user` and `/user/7`.
- `:name+` — one or more segments, joined with `/`. `/files/:path+` matches `/files/a/b/c` with `params: { path: 'a/b/c' }`.
- `:name*` — zero or more segments, joined with `/`. `/files/:path*` matches `/files` and `/files/a/b`.
- `*` — catch-all, used as a whole pattern (typically as the last route to render a NotFound page).

Param values in matched URLs are decoded with `decodeURIComponent`. When you build URLs with `navigate` or `href`, params are encoded for you, so values containing `/`, spaces, or other special characters round-trip safely. Unfilled `:name?` and `:name*` segments are dropped from the generated url — `href({ pathname: '/user/:id?' })` returns `/user` — while an unfilled required segment is left in place as-is.

### `navigate`

```js
router.navigate(to)
router.navigate(to, from)

// examples
router.navigate('/shows')
router.navigate({ url: '/show/1' })
router.navigate({ url: '/show/2', replace: true })
router.navigate({ pathname: '/shows', query: { 'most-recent': 1 } })
router.navigate({ query: { 'top-rated': 1 }, merge: true })
router.navigate({ query: { 'top-rated': undefined }, merge: true })
```

Navigate to a url. Navigating will update the browser's location bar (unless in `memory` mode) and will call the router listener callback with the newly matched route.

- `to` - a `string` url or an `object` with the following properties
  - `url` a relative url string or a route pattern
  - `pathname` the pathname portion of the target url, which can include named segments
  - `params` params to interpolate into the named pathname segments
  - `query` the query object that will be passed through `qs.stringify`. Set to `null` (with `merge`) to clear all query params
  - `hash` the hash fragment to append to the url. Set to `null` (with `merge`) to clear the hash
  - `replace` set to true to replace the current entry in the navigation stack instead of pushing
  - `merge` set to true to merge in the params, query and hash from the current url
- `from` - optional route, partial route, or navigation target to merge against instead of reading the current url — where you're navigating from. Useful in async callbacks where the current url may have moved on by the time you navigate

Note, if `url` option is provided, the `pathname`, `params`, `query` and `hash` will be ignored.

Note, be careful when using `merge` without passing `from` — it reads the location's current url, which might differ from the one you store in your application's state if you're performing async logic in the listen callback.

### `match`

```js
const route = router.match(url)
```

Match the url string against the routes and return the matching route object.

Note, the router only knows your routes once `listen` has been called — before that, `match` returns `undefined`. To match urls without listening, use `createMatcher`.

### `createMatcher`

```js
import { createMatcher } from 'space-router'

const matcher = createMatcher(routes, options)
const route = matcher.match('/user/7?tab=settings')
```

Create a standalone matcher without creating a router. Useful for matching urls before (or without) subscribing to url changes with `listen` — for example to compute the initial route synchronously during the first render, in server side rendering, or in tests.

- `routes` - the same array of route definitions that `listen` accepts
- `options` object
  - `qs` - a custom query string parser, an object of shape `{ parse, stringify }`

`matcher.match(url)` returns the same `route` object as described in [listen](#listen), or `undefined` if no route matched.

### `href`

```js
const url = router.href(to)
const url = router.href(to, from)

// examples
router.href('/shows')
router.href({ url: '/show/1' })
router.href({ pathname: '/shows', query: { 'most-recent': 1 } })
router.href({ query: { 'top-rated': 1 }, merge: true })
router.href({ query: { 'top-rated': undefined }, merge: true })
```

Create a relative url string to use in `<a href>` attribute. Param values are URL-encoded so the resulting string round-trips through `match`.

- `to` object of shape `{ pathname, params, query, hash }`. The `params` will be interpolated into the pathname if the pathname contains any parametrised segments. The `query` is an object that will be passed through `qs.stringify`.
- `from` - optional route, partial route, or navigation target to merge against when `to.merge` is set, mirroring `navigate(to, from)`.

Note: `to` can be a string, in which case `href` simply returns the input. Similarly, the `to` can contain a `{ url }` key in which case `href` returns that url. This is to align the function signature with that of `navigate` so the two can be used interchangeably.

### `getUrl`

```js
const url = router.getUrl()
```

Get the current url string. Note, this only includes the path and does not include the protocol and host.

You shouldn't need to read this most of the time since the updates to url changes and the matching route will be provided in the `listen` callback. Be especially careful if you're performing asynchronous logic in your callback, such as lazily importing some modules, where you're then constructing links based on the current url - use route provided to your listener instead of calling `getUrl` as the url might already have been updated to another value in the meantime.

### `replaceUrl`

```js
router.replaceUrl('/shows?sort=top-rated')
```

Replace the current history entry with the given url, using mode-appropriate mechanics, without emitting a route change. Unlike `navigate({ url, replace: true })`, the `listen` callback will not be called. This is for callers that have already committed a route and only need the address bar to agree — e.g. after a pre-commit transform rewrote the URL. The url is normalized the same way as in `navigate`, so `getUrl` will return exactly what a `navigate` to the same target would have produced.

### `createHistory`

```js
import { createHistory } from 'space-router'

const history = createHistory({ mode: 'history' })
const dispose = history.listen((url) => console.log(url))
history.push('/foo')
history.replace('/bar')
const url = history.getUrl()
```

A lower level building block that the router uses internally. It wraps the three url sources behind a single interface — useful if you want to listen to url changes and navigate without declaring routes or matching.

- `options` object
  - `mode` - one of `history`, `hash`, `memory`, default is `history`. `memory` is used automatically when there is no `window`, e.g. on the server
  - `sync` - same as in `createRouter`
  - `schedule` - same as in `createRouter`

Returns an object with:

- `listen(onChange)` - subscribe to url changes, returns a dispose function. Only one listener can be attached at a time
- `getUrl()` - the current url string
- `push(url)` - navigate, pushing a new entry onto the navigation stack
- `replace(url)` - navigate, replacing the current entry
- `replaceSilent(url)` - replace the current entry without emitting a url change, backs `router.replaceUrl`
