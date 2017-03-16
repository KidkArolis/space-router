const eq = require('assert').deepEqual
const createRouter = require('..')

suite('space-router')

test('createRouter() / .start(onTransition) / .push(url) / .stop()', () => {
  const calls = []

  const router = createTestRouter()
  router.start((route, data) => {
    calls.push(data[0](route.params))
  })

  router.push('/foo')
  router.push('/user/5')
  router.push('/user/7/friends')
  router.push('/user/7')
  router.push('/user/8/posts')
  router.push('/bar')

  eq([
    'foo',
    'user=5',
    'friends=7',
    'user=7',
    'catchall',
    'bar'
  ], calls)

  router.stop()
})

test('.data(route)', () => {
  let friends
  const router = createTestRouter().start((route) => { friends = route })

  router.push('/user/7/friends?a=1&b=2#abc')

  // access by pattern
  eq(router.data('/user/:id')[0]({ id: 5 }), 'user=5')
  // access by route pattern
  eq(router.data(friends.pattern)[0]({ id: 5 }), 'friends=5')
})

test('.href(url, options)', () => {
  const router = createTestRouter().start()

  eq('/user/7/friends?a=1&b=2', router.href('/user/7/friends', { query: { a: 1, b: 2 } }))
})

function createTestRouter () {
  return createRouter([
    ['/foo', () => 'foo'],
    ['/bar', () => 'bar'],
    ['/user/:id', (params) => 'user=' + params.id],
    ['/user/:id/friends', (params) => 'friends=' + params.id],
    ['*', () => 'catchall']
  ], { mode: 'memory' })
}
