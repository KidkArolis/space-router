import test from 'ava'
import { qs, createRouter } from '../src'

test('createRouter, listen, navigate and dispose', (t) => {
  const calls = []

  const { router, dispose } = createTestRouter((route) => {
    calls.push(route.data[0].render(route.params, route.query, route.hash))
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
  router.navigate({ query: { a: 11, b: 22 }, merge: true })
  router.navigate({ query: { b: undefined, c: 'bla' }, hash: 'test', merge: true })
  router.navigate({ params: { id: 3 }, merge: true })

  t.deepEqual(
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
      'user=2?a=11&b=22',
      'user=2?a=11&c=bla#test',
      'user=3?a=11&c=bla#test',
    ],
    calls
  )

  dispose()
})

test('.href(options)', (t) => {
  const { router, dispose } = createTestRouter()

  t.deepEqual('/user/7/friends?a=1&b=2', router.href({ pathname: '/user/7/friends', query: { a: 1, b: 2 } }))

  t.deepEqual(
    router.href({ pathname: '/user/:id/friends', params: { id: 7 }, query: { a: 1, b: 2 } }),
    '/user/7/friends?a=1&b=2'
  )
  t.deepEqual(
    router.href({ pathname: '/user/:id/friends', params: { id: 7 }, query: { a: 1, b: 2 }, hash: '#bla' }),
    '/user/7/friends?a=1&b=2#bla'
  )
  t.deepEqual(router.href({ pathname: '/user/:id/friends', params: { id: 8 }, hash: '#foo' }), '/user/8/friends#foo')
  t.deepEqual(
    router.href({ pathname: '/user/:id/friends', params: { id: 8 }, query: {}, hash: '#foo' }),
    '/user/8/friends#foo'
  )
  t.deepEqual(
    router.href({ pathname: '/user/:id/friends', params: { id: 8 }, query: { q: null }, hash: '#foo' }),
    '/user/8/friends?q=null#foo'
  )
  t.deepEqual(
    router.href({ pathname: '/user/:id/friends', params: { id: 8 }, query: { q: undefined }, hash: '#foo' }),
    '/user/8/friends#foo'
  )
  t.deepEqual(
    router.href({ pathname: '/user/:id/friends', params: { id: 8 }, query: { q: undefined }, hash: '#foo' }),
    '/user/8/friends#foo'
  )
  t.deepEqual(router.href({ params: { id: 8 }, query: { q: 1 }, hash: '#foo' }), '/?q=1#foo')

  dispose()
})

test('.match(url)', (t) => {
  const { router, dispose } = createTestRouter()

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

  dispose()
})

test('.match(url) without catch all', (t) => {
  const { router, dispose } = createTestRouter(null, { withoutCatchAll: true })

  const route = router.match('/unknown')
  t.is(route, undefined)

  dispose()
})

test('.getUrl()', (t) => {
  const { router } = createTestRouter()

  router.navigate({ url: '/user/8' })
  t.is(router.getUrl(), '/user/8')
})

test('redirects', (t) => {
  const calls = []

  const { router, dispose } = createTestRouter((route) => {
    calls.push(route.data[0].render(route.params, route.query))
  })

  router.navigate({ url: '/redirect-via-obj-1' })
  router.navigate({ url: '/redirect-via-obj-2' })
  router.navigate({ url: '/redirect-via-fn-1/2' })
  router.navigate({ url: '/redirect-via-fn-2/2' })

  t.deepEqual(['bar', 'user=1', 'user=2', 'foo'], calls)

  dispose()
})

function createTestRouter(cb, { withoutCatchAll = false } = {}) {
  const router = createRouter({ mode: 'memory', sync: true })
  const dispose = router.listen(
    [
      { path: '/foo', render: () => 'foo' },
      { path: '/bar', render: () => 'bar' },
      { path: '/redirect-via-obj-1', redirect: { url: 'bar' } },
      { path: '/redirect-via-obj-2', redirect: { pathname: '/user/:id', params: { id: 1 } } },
      { path: '/redirect-via-fn-1/:id', redirect: ({ params }) => ({ pathname: '/user/:id', params }) },
      { path: '/redirect-via-fn-2/:id', redirect: ({ params }) => ({ url: '/foo' }) },
      {
        path: '/user/:id',
        render: (params, query, hash = '') => {
          const q = query && Object.keys(query).length ? `?${qs.stringify(query)}` : ''
          return 'user=' + params.id + q + hash
        },
      },
      { path: '/user/:id/friends', render: (params) => 'friends=' + params.id },
      { path: '/user/:id/settings', datum: 'settings-data' },
      !withoutCatchAll && { path: '*', render: () => 'catchall' },
    ].filter(Boolean),
    cb
  )
  return { router, dispose }
}
