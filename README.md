# soda-router

Minimal, yet awesome, batteries included universal router.

Soda router packs all the features you need to always keep your app in sync with the url. It's different from most other routers in that there is only a **single callback**. Use this callback to rerender your app or update your store on each url change.

Soda router:

- listens to url changes
- supports popstate and hashchange
- intercepts link clicks to pushState or update hash
- extracts url parameters and parses query strings
- supports nested routes
- should fit a very wide range of application architectures and frameworks
- has no dependencies

## Usage

        yarn add soda-router

## Example

Example demonstrating most of the API.

```js
const createRouter = require('soda-router')

const router = createRouter(
  ['', () => 'app', [
    ['/', () => 'index'],
    ['/channels', () => 'channels', [
      ['/channels/:id', (params) => 'channel ' + params.id]
    ]],
    ['/video/:id', (params) => 'video ' + params.id],
    ['*', () => 'not found']
  ]]
).start(onTransition)

function onTransition (route, data) {
  let { params } = route
  // just logging instead of rendering to keep the example simple
  console.log('Matched', '[' + data.map(fn => fn(params)).join(', ') + ']')
}

router.push('/channels')
// -> Matched [all, channels]
router.push('/channels/5')
// -> Matched [all, channels, channel 5]
router.push('/channels/6', { replace: true })
// -> Matched [all, channels, channel 6], replaces current url, back button goes to /channels
router.push('/video/5', { query: { t: '30s' } })
// -> Matched [all, channels, video 5], adds a query string to the url /video/5?t=30s

router.current()
// -> returns { pattern, params, path, pathname, query, hash, data }

router.data('/channels/:id')
// -> [() => 'all', (params) => 'channel ' + params.id]
router.data({ pattern: '/channels/:id' })
// -> [() => 'all', (params) => 'channel ' + params.id]

router.href('/video/5', { query: { t: '25s' } })
// -> '/video/5?t=25s' in history mode or /#/video/5?t=25s in hash mode
```

Example usage with `preact`.

```js

```

You can use [jetpack](https://github.com/KidkArolis/jetpack) to try these examples out. Clone the repo and run `jetpack soda-router/examples/preact`.

## API

### `createRouter(routes, options)`

* `routes` an array of arrays of route definitions, e.g. ['/:pattern', Component] or ['/:pattern', Component, [...children...]]
* `options` object of shape { mode, root, interceptLinks, qs }

### `start(onTransition)`

Start the routing, will immediately call `onTransition` based on the current URL.

### `stop()`

Stop the routing, remove DOM `click` and `popstate` listeners.

### `push(url, options)`

Navigate to a url. Will call `onTransition`.

* `options` object of shape { replace, query }

### `data(pattern|route)`

Exchange a route pattern or route object of shape { pattern } to the array of data associated with this route.

### `href(url, options)`

Generate a url. Useful if you want to append query string or if you're using mixed history/hash mode and you don't know which one is in play. Href will prepend urls with '#' when in hash mode.

* `options` object of shape { query }

## Advanced features

Here are some tips on how to achieve certain more advanced use cases if they're relevant for you app.

### Rerendering directly in onChange

### Rerendering via store and router.data()

### Nesting components

### Abstract routes

### Using next() to add async behaviour or cancel routing

### Using pushState with fallback to hash

### Using custom query string parser

### Using custom scroll behaviour

### Using custom link interception
