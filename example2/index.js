const createRouter = require('..')

const router = createRouter(
  ['', () => 'all', [
    ['/', () => 'index'],
    ['/foo', () => 'foo', [
      ['/foo/nested', () => 'foo2']
    ]],
    ['/bar/:id', (params) => 'bar ' + params.id],
    ['*', () => 'not found']
  ]]
).start(render)

function render (route) {
  let { path, params, data } = route
  console.log('Matched', data.map(fn => fn()).join(' - '))
}

router.push('/foo')
 // -> Matched all - foo - foo2
router.push('/bar/5')
// // -> Matched all - bar 5
// router.push('/bar/6', { replace: true })
// // -> Matched all - bar 6, replaces current url, back button goes to /foo
// router.push('/bar/7', { query: { q: 1 } })
// // -> Matched all - bar 7, adds a query string to the url /bar/7?q=1

console.log(router.current())
// -> returns { pattern, params, path, pathname, query, hash, data }

router.isActive('/bar/7')
// -> true
router.isActive('/bar/7?q=2')
// -> true
router.isActive('/bar/6')
// -> false

router.href('/bar/7', { query: { q: 1 } })
// -> '/bar/7?q=1' or /#/bar7?q=1 in hash mode
