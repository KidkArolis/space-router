if (module.hot) {
  module.hot.accept()
  module.hot.dispose(() => {
    // perform cleanup
  })
}

const Preact = require('preact')
const createRouter = require('..')
require('./styles.css')

const App = ({ router, children }) =>
  <div className='App'>
    <div className='Nav'>
      <a href='#/foo'>Foo</a>
      <a href='#/bar'>Bar</a>
      <a href='#/async'>Async</a>
      <a href='#/blocked'>Blocked</a>
    </div>
    <div className='Content'>
      {children}
    </div>
  </div>

const Home = (props) =>
  <div className='Home'>Home</div>

const Foo = (props) =>
  <div className='Foo'>Foo</div>

const Bar = (props) =>
  <div className='Bar'>Bar</div>

const User = (props) =>
  <div className='User'>User</div>

const UserIndex = (props) =>
  <div className='UserIndex'>UserIndex</div>

const Profile = (props) =>
  <div className='Profile'>Profile</div>

const Posts = (props) =>
  <div className='Posts'>Posts</div>

const NotFound = (props) =>
  <div className='NotFound'>404</div>

const Async = (props) =>
  <div className='Async'>Async</div>

const root = document.getElementById('root')

const router = window.router = createRouter(
  ['', App, [
    ['/', Home],
    ['/foo', Foo],
    ['/bar', Bar],
    ['/async', Async],
    ['/blocked', { cancel: true }],
    ['', User, [
      ['/user/:userId', UserIndex],
      ['/user/:userId/profile', Profile],
      ['/user/:userId/posts', Posts]
    ]],
    ['*', NotFound]
  ]]
).start(render)

// function prepare (route, next) {
//   if (route.data.find(r => r.cancel)) {
//     return next(false)
//   }

//   if (route.pattern === '/async') {
//     return setTimeout(next, 1000)
//   }

//   next()
// }

function render (route, next) {
  let { data } = route

  if (route.data.find(r => r.cancel)) {
    return next && next(false)
  }

  let Root = data.reduceRight((children, component) => {
    return Preact.h(component, { router, children })
  }, null)
  Preact.render(Root, root, root.lastChild)
}

// /**
//  * tiny-router
//  *
//  * router([
//  *   ['/:trackingId', Show],
//  *   ['/']
//  *   ['/about', About]
//  * ])
//  */

// module.exports = function (routes, options) {
//   routes = routes || []
//   options = options || {}
// }

// // scroll behaviour
// const router = createRouter({ mode: 'history|hash|memory|customFn', root: '/', interceptLinks: false, qs, match })
//   .route(App)
//   .route('/:trackingId', Show)
//   .route('/:trackingId/switch', Switcher)
//   .route('/:trackingId/shop', Switcher, Shop)
//   .route('/issues', Issues)
//   .route('/issues/:issueId', Issues, Issue)
//   .route('/about', About)
//   .start(beforeChange, onChange)

// router.go('/foo/bar')
// router.go('/foo/bar', { replace: true })
// router.go('/foo/bar', { query })
// router.href('/foo/bar', { query })
// router.isActive('/foo/bar')

// function onChange (route, components) {
//   // route is { params, path, pathname, query, hash }
//   atom.split({ route, components })
// }

// const atom = createAtom({}, null, render)

// function render () {
//   let { components } = atom.get().route
//   return components.reduceRight((children, component) => {
//     return React.createElement(component, { atom, router, children })
//   }, null)
// }

// // router -> atom -> render
