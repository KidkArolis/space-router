const eq = require('assert').deepStrictEqual
const createRouter = require('..')
const qs = require('../src/qs')

suite('space-router')

test('createRouter() / .listen(onTransition) / .push(url) / .stop()', () => {
  const calls = []

  const router = createTestRouter()
  router.listen(({ route, data }) => {
    calls.push(data[0].fn(route.params, route.query))
  })

  router.push('/foo')
  router.push('/user/5')
  router.push('/user/7/friends')
  router.push('/user/7')
  router.push('/user/8/posts')
  router.push('/bar')
  router.push({ pattern: '/user/:id', params: { id: 1 }, merge: true })
  router.push({ params: { id: 2 }, merge: true })
  router.push({ query: { a: 1, b: 2 }, merge: true })
  router.push({ query: { b: 4, c: 5 }, merge: true })
  router.push({ query: null, merge: true })

  eq(
    [
      'foo',
      'user=5',
      'friends=7',
      'user=7',
      'catchall',
      'bar',
      'user=1',
      'user=2',
      'user=2?a=1&b=2',
      'user=2?a=1&b=4&c=5',
      'user=2'
    ],
    calls
  )

  router.stop()
})

test('.data(route)', () => {
  let friends
  const router = createTestRouter().listen(({ route }) => {
    friends = route
  })

  router.push('/user/7/friends?a=1&b=2#abc')

  // access by pattern
  eq(router.data('/user/:id')[0].fn({ id: 5 }), 'user=5')
  // access by route pattern
  eq(router.data(friends.pattern)[0].fn({ id: 5 }), 'friends=5')
})

test('.href(url, options)', () => {
  const router = createTestRouter().listen()

  eq('/user/7/friends?a=1&b=2', router.href({ pathname: '/user/7/friends', query: { a: 1, b: 2 } }))
  eq(
    '/user/7/friends?a=1&b=2',
    router.href({ pathname: '/user/:id/friends', params: { id: 7 }, query: { a: 1, b: 2 } })
  )
  eq(
    '/user/7/friends?a=1&b=2#bla',
    router.href({ pathname: '/user/:id/friends', params: { id: 7 }, query: { a: 1, b: 2 }, hash: '#bla' })
  )
  eq('/user/8/friends#foo', router.href({ pathname: '/user/:id/friends', params: { id: 8 }, hash: '#foo' }))
  eq(
    '/user/8/friends#foo',
    router.href({
      pathname: '/user/:id/friends',
      params: { id: 8 },
      query: {},
      hash: '#foo'
    })
  )
  eq(
    '/user/8/friends?q=null#foo',
    router.href({
      pathname: '/user/:id/friends',
      params: { id: 8 },
      query: { q: null },
      hash: '#foo'
    })
  )
  eq(
    '/user/8/friends#foo',
    router.href({
      pathname: '/user/:id/friends',
      params: { id: 8 },
      query: { q: undefined },
      hash: '#foo'
    })
  )
})

test('.match(url)', () => {
  const router = createTestRouter()

  const route = {
    hash: '',
    href: '/user/7/settings?a=1',
    params: {
      id: '7'
    },
    pathname: '/user/7/settings',
    pattern: '/user/:id/settings',
    query: {
      a: '1'
    }
  }
  const data = [{ name: 'settings-data' }]
  eq({ route, data }, router.match('/user/7/settings?a=1'))
})

function createTestRouter() {
  return createRouter({ mode: 'memory' }).map([
    { path: '/foo', fn: () => 'foo' },
    { path: '/bar', fn: () => 'bar' },
    {
      path: '/user/:id',
      fn: (params, query) => {
        const q = query && Object.keys(query).length ? `?${qs.stringify(query)}` : ''
        return 'user=' + params.id + q
      }
    },
    { path: '/user/:id/friends', fn: params => 'friends=' + params.id },
    { path: '/user/:id/settings', name: 'settings-data' },
    { path: '*', fn: () => 'catchall' }
  ])
}
