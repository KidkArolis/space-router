const { eq } = require('@briancavalier/assert')
const createRouter = require('..')

suite('tiny-router')

test('createRouter() / .start(onTransition) / .push(url) / .stop()', () => {
  const calls = []

  const router = createTestRouter()
  router.start(route => calls.push(route.data[0](route.params)))

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

test('.current()', () => {
  const router = createTestRouter().start()

  router.push('/user/7/friends?a=1&b=2#abc')

  const curr = router.current()
  curr.data[0] = curr.data[0](curr.params)
  eq(curr, {
    data: [
      'friends=7'
    ],
    hash: '#abc',
    params: {
      id: '7'
    },
    path: '/user/7/friends?a=1&b=2#abc',
    pathname: '/user/7/friends',
    pattern: '/user/:id/friends',
    query: {
      a: '1',
      b: '2'
    }
  })
})

test('.data(route)', () => {
  const router = createTestRouter().start()

  router.push('/user/7/friends?a=1&b=2#abc')
  const friends = router.current()
  router.push('/foo')

  // access by pattern
  eq(router.data('/user/:id')[0]({ id: 5 }), 'user=5')
  // access by route match
  eq(router.data(friends)[0]({ id: 5 }), 'friends=5')
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
