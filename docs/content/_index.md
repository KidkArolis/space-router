---
title: 'Space Router'
draft: false
toc: true
---

# Space Router

> Framework agnostic router for single page apps

Space Router packs all the features you need to keep your app in sync with the url. It's distinct from many other routers in that there is only **a single callback**. This callback can be used to re-render your applocation, update a store and perform other actions on each url change. Space Router is **stateless**, it doesn't store the current route leaving state completely up to you to handle.

In summary, Space Router:

- listens to url changes using popstate or hashchange event
- extracts url parameters and parses query strings
- supports nested routes and arbitrary route metadata
- fits into a wide range of application architectures and frameworks
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
  - `mode` - one of `history`, `hash`, `memory`, default is `history`
  - `qs` - a custom query string parser, an object of shape `{ parse, stringify }`

### `listen`

```js
const dispose = router.listen(routes, onChange)
```

Start listening to url changes. Every time the url changes via back/forward button or by performing programmatic navigations, the `onChange` callback will get called with the matched `route` object.

Note, calling listen will immediately call `onChange` based on the current url when in `history` or `hash` modes. This does not happen in `memory` mode so that you could perform the initial navigation yourself since there is no url to read from in that case.

- `routes` an array of arrays of route definitions, where each route is an object of shape `{ path, redirect, routes, ...metadata }`
  - `path` is the url pattern to match that can include named parameters as segments
  - `redirect` can be a string or a function that redirects upon entering that route
  - `routes` is a nested object of nested route definitions
  - `...metadata` all other other keys can be chosen by you
- `onChange` is called with `(route)`
  - `route` is an object of shape `{ pattern, href, pathname, params, query, search, hash }`
  - `data` is an array of datas associated with this route

Listen returns a `dispose` function that stops listening to url changes.

### `navigate`

```js
router.navigate(to)
```

Navigate to a url. Navigating will update the browser's location bar, depending no the mode the router is in and will call the router listener callback with the newly matched route.

- `to` - a `string` url or an `object` with the following properties
  - `url` a relative url string or a route pattern
  - `pathname` the pathname portion of the target url, which can include named segments
  - `params` params to interpolate into the named pathname segments
  - `query` the query object that will be passed through `qs.stringify`
  - `hash` the hash fragment to append to the url of the url
  - `replace` set to true to replace the current entry in the navigation stack instead of pushing
  - `merge` set to true to merge in the params from the current url, alternatively set to the current route object to use that as the current route to be used in merging

Note, if `url` option is provided, the `pathname`, `params`, `query` and `hash` will be ignored.

Note, be careful when using `merge` as this reads the location's current url which might be different from the one you store in your application's state in case you're performing async logic in the listen callback.

### `match`

```js
const route = router.match(url)
```

Match the url string against the routes and return the matching route object. Useful in server side rendering to translate the request url to a matching route.

### `href`

```js
const url = router.href(to)
```

Create a relative url string to use in `<a href>` attribute.

- `to` object of shape `{ pathname, params, query, hash }`. The `params` will be interpolated into the pathname if the pathname contains any parametrised segments. The `query` is an object that will be passed through `qs.stringify`.

Note: `to` can also be a string, in which case href simply returns the input. This is to align the function signature with that of `navigate` so the two can be used interchangeably.

### `getUrl`

```js
const url = router.getUrl()
```

Get the current url string. Note, this only includes the path and does not not include the protocol and host.

You shouldn't need to read this most of the time since the updates to url changes and the matching route will be provided in the `listen` callback. Be especially careful if you're performing asynchronous logic in your callback, such as lazily importing some modules, where you're then constructing links based on the current url - use route provided to your listener instead of calling `getUrl` as the url might already have been updated to another value in the meantime.
