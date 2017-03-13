# tiny-router

Minimal, yet awesome, universal router.

The core principle is to declare url patterns and associate some data with it, such as components, functions, objects, etc. On each url change a callback is called with the path, params, query and also the data you associated with this route. If the data is components, you can render them. Alternatively, you can pass this state to the store and render it from there. Whatever fits your application's architecture best.

## Usage

        yarn add tiny-router

## Example

Example demonstrating most of the API.

```js
const router = createRouter([
  ['', () => 'all', [
    ['/', () => 'index'],
    ['/foo', () => 'foo', [
      ['/foo/nested', () => 'foo2']
    ]],
    ['/bar/:id', (params) => 'bar ' + params.id],
    ['*', () => 'not found']
  ]
]).start(onTransition)

function onTransition (route) {
  let { path, params, data } = route
  // just logging instead of rendering to keep the example simple
  console.log('Matched', data.map(fn => fn()).join(' - '))
}

router.push('/foo')
 // -> Matched all - foo - foo2
router.push('/bar/5')
// -> Matched all - bar 5
router.push('/bar/6', { replace: true })
// -> Matched all - bar 6, replaces current url, back button goes to /foo
router.push('/bar/7', { query: { q: 1 } })
// -> Matched all - bar 7, adds a query string to the url /bar/7?q=1

router.current()
// -> returns { pattern, params, path, pathname, query, hash, data }

router.data('/bar/:id')
// -> [() => 'all', (params) => 'bar ' + params.id]
router.data({ pattenr: '/bar/:id' })
// -> [() => 'all', (params) => 'bar ' + params.id]

router.href('/bar/7', { query: { q: 1 } })
// -> '/bar/7?q=1' or /#/bar7?q=1 in hash mode
```

Example usage with `preact`.

```js

```

## API

### `createRouter(options)`

...

### `start(onTransition)`

...

### `push(url, options)`

...

### `data(pattern|route)`

Exchange a route pattern or route object of shape { pattern } to the data associated with this route.

### `href(url, options)`

...

## Advanced features

Here are some tips on how to achieve certain more advanced use cases if they're relevant for you app.

### Nesting components

### Abstract routes

### Using next() to add async behaviour or cancel routing

### Using pushState with fallback to hash

### Using custom query string parser

### Using custom scroll behaviour

### Using custom link interception
