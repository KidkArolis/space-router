import test from 'ava'
import { qs, createRouter } from '../src'

test('createRouter, listen, navigate and dispose', (t) => {
  const calls = []

  const { router, dispose } = createTestRouter((route) => {
    calls.push(route.data[0].render(route.params, route.query))
  })

  router.navigate({ url: '/foo' })
  router.navigate({ url: '/user/5' })
  router.navigate({ url: '/user/7/friends' })
  router.navigate({ url: '/user/7' })
  router.navigate({ url: '/user/8/posts' })
  router.navigate({ url: '/bar' })
  router.navigate({ url: '/user/1' })
  router.navigate({ pathname: '/user/:id', params: { id: 2 } })
  router.navigate({ pathname: '/user/2', query: { a: 1, b: 2 } })

  t.deepEqual(['foo', 'user=5', 'friends=7', 'user=7', 'catchall', 'bar', 'user=1', 'user=2', 'user=2?a=1&b=2'], calls)

  dispose()
})

test('.href(options)', (t) => {
  const { router } = createTestRouter()

  t.deepEqual('/user/7/friends?a=1&b=2', router.href({ pathname: '/user/7/friends', query: { a: 1, b: 2 } }))

  t.deepEqual(
    '/user/7/friends?a=1&b=2',
    router.href({ pathname: '/user/:id/friends', params: { id: 7 }, query: { a: 1, b: 2 } })
  )
  t.deepEqual(
    '/user/7/friends?a=1&b=2#bla',
    router.href({ pathname: '/user/:id/friends', params: { id: 7 }, query: { a: 1, b: 2 }, hash: '#bla' })
  )
  t.deepEqual('/user/8/friends#foo', router.href({ pathname: '/user/:id/friends', params: { id: 8 }, hash: '#foo' }))
  t.deepEqual(
    '/user/8/friends#foo',
    router.href({ pathname: '/user/:id/friends', params: { id: 8 }, query: {}, hash: '#foo' })
  )
  t.deepEqual(
    '/user/8/friends?q=null#foo',
    router.href({ pathname: '/user/:id/friends', params: { id: 8 }, query: { q: null }, hash: '#foo' })
  )
  t.deepEqual(
    '/user/8/friends#foo',
    router.href({ pathname: '/user/:id/friends', params: { id: 8 }, query: { q: undefined }, hash: '#foo' })
  )
})

test('.match(url)', (t) => {
  const { router } = createTestRouter()

  const route = {
    url: '/user/7/settings?a=1#hello',
    pattern: '/user/:id/settings',
    pathname: '/user/7/settings',
    params: { id: '7' },
    query: { a: '1' },
    search: '?a=1',
    hash: '#hello',
    data: [{ datum: 'settings-data' }],
  }
  t.deepEqual(router.match('/user/7/settings?a=1#hello'), route)
})

test('redirects', (t) => {
  const calls = []

  const { router, dispose } = createTestRouter((route) => {
    calls.push(route.data[0].render(route.params, route.query))
  })

  router.navigate({ url: '/will-redirect' })

  t.deepEqual(['bar'], calls)

  dispose()
})

function createTestRouter(cb) {
  const router = createRouter({ mode: 'memory', sync: true })
  const dispose = router.listen(
    [
      { path: '/foo', render: () => 'foo' },
      { path: '/bar', render: () => 'bar' },
      { path: '/will-redirect', redirect: '/bar' },
      {
        path: '/user/:id',
        render: (params, query) => {
          const q = query && Object.keys(query).length ? `?${qs.stringify(query)}` : ''
          return 'user=' + params.id + q
        },
      },
      { path: '/user/:id/friends', render: (params) => 'friends=' + params.id },
      { path: '/user/:id/settings', datum: 'settings-data' },
      { path: '*', render: () => 'catchall' },
    ],
    cb
  )
  return { router, dispose }
}
