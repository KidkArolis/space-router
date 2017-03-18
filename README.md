# space-router

Minimal, yet awesome, batteries included universal router.

Space router packs all the features you need to always keep your app in sync with the url. It's different from most other routers in that there is only a **single callback**. Use this callback to rerender your app or update your store on each url change.

Space router:

- listens to url changes via popstate and/or hashchange
- handles all link clicks in your app
- extracts url parameters and parses query strings
- supports nested routes
- should fit a very wide range of application architectures and frameworks
- has no dependencies and weights 1.8kb

## Usage

    yarn add space-router

## Example

Example demonstrating most of the API.

```js
const createRouter = require('space-router')

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

router.data('/channels/:id')
// -> [() => 'all', (params) => 'channel ' + params.id]

router.href('/video/5', { query: { t: '25s' } })
// -> '/video/5?t=25s' in history mode or /#/video/5?t=25s in hash mode
```

Here's an example that renders the app with `preact`.

```js
const Preact = require('preact')
const createRouter = require('space-router')

const App = ({ router, children }) =>
  <div className='App'>
    <div className='Nav'>
      <a href='/'>Home</a>
      <a href='/channels'>Channels</a>
      <a href='/channels/5'>Channel 5</a>
    </div>
    <div className='Content'>
      {children}
    </div>
    <style>{`
      body, html { padding: 20px; font-family: sans-serif; }
      a { padding: 10px; }
      .Nav { padding: 10px 0; border-bottom: 1px solid #eee; }
      .Content { padding: 20px 10px; }
    `}
    </style>
  </div>

const Home = (props) => <div>Home</div>
const Channels = (props) => <div>Channels</div>
const Channel = (props) => <div>Channel {props.params.id}</div>
const NotFound = (props) => <div>404</div>

const router = createRouter([
  ['', App, [
    ['/', Home],
    ['/channels', Channels],
    ['/channels/:id', Channel],
    ['*', NotFound]
  ]]
]).start(render)

function render (route, components) {
  let app = components.reduceRight((children, Component) =>
    <Component params={route.params}>{children}</Component>
  , null)
  Preact.render(app, document.body, document.body.lastElementChild)
}
```

There are many other ways you could go about it depending on your application's architecture. E.g. one nice strategy is to update your central store via the `onTransition` callback and then use the `router.data()` helper to get the relevant components in your main render function.

You can use [jetpack](https://github.com/KidkArolis/jetpack) to try these examples out. Clone the repo and run `jetpack space-router/examples/preact`.

## API

### `createRouter(routes, options)`

* `routes` an array of arrays of route definitions, e.g. e.g. `['/:pattern', Component, [...children]]`
* `options` object of shape `{ mode, interceptLinks, qs }`
  * `mode` - one of `history`, `hash`, `memory`, default is `history`
  * `interceptLinks` - whether to handle `<a>` clicks, default is `true`
  * `qs` - a custom query string parser, object of shape `{ parse, stringify }`

### `start(onTransition)`

Start the routing, will immediately call `onTransition` based on the current URL.

* `onTransition` is called with `(route, data)`
  - `route` is an object of shape `{ pattern, path, pathname, params, query, hash }`
  - `data` is an array of datas associated with this route

### `stop()`

Stop the routing, remove DOM `click` and `popstate/hashchange` listeners.

### `push(url, options)`

Navigate to a url. Updates browser URL and calls `onTransition`.

- `url` a relative url string
- `options` an object of shape `{ replace, query }`

### `href(url, options)`

Generate a url. Useful if you want to append query string or if you're using mixed history/hash mode and you don't know which one is in play. Href will prepend urls with '#' when in hash mode.

* `options` object of shape { query }

### `data(pattern)`

Exchange a route pattern to the array of data associated with this route. Useful when implementing a stateless pattern, where current route state is stored in a central store, and rendering logic needs to look up the component(s) associated with the given route.

## Missing features

Space router **does not** do the following yet:

- support custom root/base url when using pushState
- support async transitions, often this is done at the view layer nowadays, but I could add beforeTransition hook or next callback if you have a use case
- support canceling transitions via a confirmation
- handle scroll positions, browsers are starting to do that natively (see this article on [scroll restoration](https://reacttraining.com/react-router/web/guides/scroll-restoration))

[Post an issue](https://github.com/KidkArolis/space-router/issues/new) and I might add these features.
