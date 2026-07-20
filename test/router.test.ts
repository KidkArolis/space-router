import test from 'ava'
import { qs, createMatcher, createRouter } from '../src/index.ts'
import type { NavigationInfo, Route, RouteDefinition, Router } from '../src/index.ts'

interface TestRouteData {
  component?: string
  datum?: string
  render?: (params: Record<string, string>, query: Record<string, string>, hash?: string) => string
}

interface TestRouterOptions {
  withoutCatchAll?: boolean
}

type RouteChange = (route: Route<TestRouteData> | undefined, info: NavigationInfo) => void

test('createRouter, listen, navigate and dispose', (t) => {
  const calls: string[] = []

  const { router, dispose } = createTestRouter((route) => {
    calls.push(renderRoute(route))
  })

  router.navigate({ url: '/foo' })
  router.navigate({ url: '/user/5' })
  router.navigate({ url: '/user/7/friends' })
  router.navigate({ url: '/user/7' })
  router.navigate({ url: '/user/8/posts' })
  router.navigate('/bar')
  router.navigate('/user/1')
  router.navigate({ pathname: '/user/:id', params: { id: 2 } })
  router.navigate({ pathname: '/user/2', query: { a: 1, b: 2 } })
  router.navigate({ query: { a: 11, b: 22 }, merge: true })
  router.navigate({ query: { b: undefined, c: 'bla' }, hash: 'test', merge: true })
  router.navigate({ params: { id: 3 }, merge: true })
  router.navigate({ query: { curr: 'test' }, merge: true }, { pathname: '/user/curr' })

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
      'user=curr?curr=test',
    ],
    calls,
  )

  dispose()
})

test('.href(to)', (t) => {
  const { router, dispose } = createTestRouter()

  t.deepEqual('/user/7/friends?a=1&b=2', router.href({ pathname: '/user/7/friends', query: { a: 1, b: 2 } }))

  t.deepEqual(
    router.href({ pathname: '/user/:id/friends', params: { id: 7 }, query: { a: 1, b: 2 } }),
    '/user/7/friends?a=1&b=2',
  )
  t.deepEqual(
    router.href({ pathname: '/user/:id/friends', params: { id: 7 }, query: { a: 1, b: 2 }, hash: '#bla' }),
    '/user/7/friends?a=1&b=2#bla',
  )
  t.deepEqual(router.href({ pathname: '/user/:id/friends', params: { id: 8 }, hash: '#foo' }), '/user/8/friends#foo')
  t.deepEqual(
    router.href({ pathname: '/user/:id/friends', params: { id: 8 }, query: {}, hash: '#foo' }),
    '/user/8/friends#foo',
  )
  t.deepEqual(
    router.href({ pathname: '/user/:id/friends', params: { id: 8 }, query: { q: null }, hash: '#foo' }),
    '/user/8/friends?q=null#foo',
  )
  t.deepEqual(
    router.href({ pathname: '/user/:id/friends', params: { id: 8 }, query: { q: undefined }, hash: '#foo' }),
    '/user/8/friends#foo',
  )
  t.deepEqual(
    router.href({ pathname: '/user/:id/friends', params: { id: 8 }, query: { q: undefined }, hash: '#foo' }),
    '/user/8/friends#foo',
  )
  t.deepEqual(router.href({ params: { id: 8 }, query: { q: 1 }, hash: '#foo' }), '/?q=1#foo')

  dispose()
})

test('href returns browser-facing urls in each mode', (t) => {
  const history = createRouter({ mode: 'history' })
  const memory = createRouter({ mode: 'memory' })
  const hash = createRouter({ mode: 'hash' })

  t.is(history.href('/people'), '/people')
  t.is(history.href('/people/'), '/people')
  t.is(memory.href('/people'), '/people')
  t.is(memory.href('/people/'), '/people')
  t.is(hash.href('/people'), '#/people')
  t.is(hash.href('/people/'), '#/people')
  t.is(hash.href('#/people'), '#/people')
  t.is(hash.href('#/people/'), '#/people')
  t.is(hash.href({ pathname: '/people', query: { page: 2 } }), '#/people?page=2')
  t.is(hash.href({ pathname: '/docs', hash: 'install' }), '#/docs#install')

  for (const router of [history, memory, hash]) {
    t.is(router.href('#section'), '#section')
    t.is(router.href('#section/'), '#section/')
    t.is(router.href('mailto:hello@example.com'), 'mailto:hello@example.com')
    t.is(router.href('//cdn.example.com/file'), '//cdn.example.com/file')
  }
})

test('routeUrl converts only browser hrefs owned by the configured mode', (t) => {
  const history = createRouter({ mode: 'history' })
  const memory = createRouter({ mode: 'memory' })
  const hash = createRouter({ mode: 'hash' })

  t.is(history.routeUrl('/people?page=2'), '/people?page=2')
  t.is(memory.routeUrl('/people?page=2'), '/people?page=2')
  t.is(hash.routeUrl('#/people?page=2'), '/people?page=2')
  t.is(hash.routeUrl('/people?page=2'), null)

  for (const router of [history, memory, hash]) {
    t.is(router.routeUrl('#section'), null)
    t.is(router.routeUrl('https://example.com/people'), null)
    t.is(router.routeUrl('//example.com/people'), null)
  }
})

test('navigate accepts the browser-facing href returned in hash mode without double-prefixing', (t) => {
  const router = createRouter({ mode: 'hash', sync: true })
  const href = router.href('/people')

  router.navigate(href)

  t.is(href, '#/people')
  t.is(router.getUrl(), '/people')
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
    data: [{ path: '/user/:id/settings', datum: 'settings-data' }],
  }
  t.deepEqual(router.match('/user/7/settings?a=1#hello'), route)

  dispose()
})

test('createMatcher matches routes without history or listen', (t) => {
  const matcher = createMatcher<{ component: string }>([
    {
      component: 'root',
      routes: [
        {
          path: '/user/:id',
          component: 'user',
        },
      ],
    },
  ])

  t.deepEqual(matcher.match('/user/7'), {
    url: '/user/7',
    pattern: '/user/:id',
    pathname: '/user/7',
    params: { id: '7' },
    query: {},
    search: '',
    hash: '',
    data: [
      { path: '', component: 'root' },
      { path: '/user/:id', component: 'user' },
    ],
  })
})

test('.match(url) without catch all', (t) => {
  const { router, dispose } = createTestRouter(undefined, { withoutCatchAll: true })

  const route = router.match('/unknown')
  t.is(route, undefined)

  dispose()
})

test('.getUrl()', (t) => {
  const { router } = createTestRouter()

  router.navigate('/user/8')
  t.is(router.getUrl(), '/user/8')
})

test('redirects', (t) => {
  const calls: string[] = []

  const { router, dispose } = createTestRouter((route) => {
    calls.push(renderRoute(route))
  })

  router.navigate('/redirect-via-obj-1')
  router.navigate('/redirect-via-obj-2')
  router.navigate('/redirect-via-fn-1/2')
  router.navigate('/redirect-via-fn-2/2')

  t.deepEqual(['bar', 'user=1', 'user=2', 'foo'], calls)

  dispose()
})

test('redirects emit only the final matched or unmatched destination metadata', (t) => {
  const calls: { url: string | undefined; traversal: boolean }[] = []
  const router = createRouter({ mode: 'memory', sync: true })
  router.listen(
    [
      { path: '/matched-redirect', redirect: '/destination' },
      { path: '/unmatched-redirect', redirect: '/missing' },
      { path: '/destination' },
    ],
    (route, info) => calls.push({ url: route?.url, traversal: info.traversal }),
  )

  router.navigate('/matched-redirect')
  router.navigate('/unmatched-redirect')

  t.deepEqual(calls, [
    { url: '/destination', traversal: false },
    { url: undefined, traversal: false },
  ])
})

test('href encodes params', (t) => {
  const { router, dispose } = createTestRouter()

  // slashes (and other special chars) get encoded so match round-trips
  t.is(router.href({ pathname: '/user/:id', params: { id: 'a/b' } }), '/user/a%2Fb')
  t.is(router.href({ pathname: '/user/:id', params: { id: 'a b' } }), '/user/a%20b')
  t.is(router.href({ pathname: '/user/:id', params: { id: 'a?b' } }), '/user/a%3Fb')
  t.is(router.match('/user/a%2Fb')?.params.id, 'a/b')

  dispose()
})

test('href strips param flags', (t) => {
  const { router, dispose } = createTestRouter()

  t.is(router.href({ pathname: '/user/:id?', params: { id: '7' } }), '/user/7')
  t.is(router.href({ pathname: '/files/:p+', params: { p: 'a/b' } }), '/files/a/b')
  t.is(router.href({ pathname: '/files/:p*', params: { p: 'a/b/c' } }), '/files/a/b/c')
  // splat encodes per segment
  t.is(router.href({ pathname: '/files/:p+', params: { p: 'a b/c' } }), '/files/a%20b/c')

  dispose()
})

test('href drops unfilled optional and splat params', (t) => {
  const { router, dispose } = createTestRouter()

  // ? and * mean the segment may be absent — no params, empty params,
  // and empty-string values all drop the segment along with its slash
  t.is(router.href({ pathname: '/user/:id?' }), '/user')
  t.is(router.href({ pathname: '/user/:id?', params: {} }), '/user')
  t.is(router.href({ pathname: '/user/:id?', params: { id: '' } }), '/user')
  t.is(router.href({ pathname: '/files/:rest*' }), '/files')
  t.is(router.href({ pathname: '/files/:rest*', params: { rest: '' } }), '/files')
  t.is(router.href({ pathname: '/a/:b?/c' }), '/a/c')
  t.is(router.href({ pathname: '/:lang?' }), '/')

  // in trailing position (the advertised use) the resulting urls
  // round-trip through match
  const matcher = createMatcher([{ path: '/user/:id?' }, { path: '/files/:rest*' }])
  t.is(matcher.match(router.href({ pathname: '/user/:id?' }))?.pattern, '/user/:id?')
  t.is(matcher.match(router.href({ pathname: '/files/:rest*' }))?.pattern, '/files/:rest*')

  // unfilled required params stay literal — loud garbage-in, garbage-out
  t.is(router.href({ pathname: '/user/:id' }), '/user/:id')
  t.is(router.href({ pathname: '/files/:rest+' }), '/files/:rest+')

  dispose()
})

test('href handles params with shared name prefixes', (t) => {
  const { router, dispose } = createTestRouter()

  t.is(router.href({ pathname: '/x/:idName/y/:id', params: { id: 'ID', idName: 'NAME' } }), '/x/NAME/y/ID')

  dispose()
})

test('redirects: caps an infinite loop', (t) => {
  const router = createRouter({ mode: 'memory', sync: true })
  router.listen([
    { path: '/a', redirect: '/b' },
    { path: '/b', redirect: '/a' },
  ])

  t.throws(() => router.navigate('/a'), { message: /too many redirects/ })
})

test('navigate before listen does not throw', (t) => {
  const router = createRouter({ mode: 'memory', sync: true })
  t.notThrows(() => router.navigate('/foo'))
  t.is(router.getUrl(), '/foo')
})

test('getUrl after dispose does not throw', (t) => {
  const router = createRouter({ mode: 'memory', sync: true })
  const dispose = router.listen([{ path: '/foo' }], () => {})
  router.navigate('/foo')
  dispose()
  t.notThrows(() => router.getUrl())
  t.is(router.getUrl(), '/foo')
})

test('a rejected second listen leaves the active matcher and listener intact', (t) => {
  const calls: string[] = []
  const router = createRouter({ mode: 'memory', sync: true })
  const dispose = router.listen([{ path: '/a' }], (route) => calls.push(route?.url ?? 'unmatched'))

  t.throws(() => router.listen([{ path: '/b' }], () => {}), { message: 'Already listening' })

  router.navigate('/a')
  t.deepEqual(calls, ['/a'])
  t.truthy(router.match('/a'))
  t.is(router.match('/b'), undefined)
  dispose()
})

test('coalesces rapid async navigations into a single emit', async (t) => {
  const calls: string[] = []
  const router = createRouter({ mode: 'memory' })
  router.listen([{ path: '*' }], (route) => {
    calls.push(route?.url ?? 'unmatched')
  })

  router.navigate('/a')
  router.navigate('/b')
  router.navigate('/c')

  await Promise.resolve()

  t.deepEqual(calls, ['/c'])
})

test('replaceUrl updates the url without emitting a route change', async (t) => {
  const calls: string[] = []
  const router = createRouter({ mode: 'memory' })
  router.listen([{ path: '*' }], (route) => calls.push(route?.url ?? 'unmatched'))

  router.navigate('/a')
  await Promise.resolve()
  t.deepEqual(calls, ['/a'])

  router.replaceUrl('/b')
  t.is(router.getUrl(), '/b', 'visible synchronously')

  // flush microtasks and a macrotask to prove no emit was scheduled
  await new Promise((resolve) => setTimeout(resolve))
  t.deepEqual(calls, ['/a'])
})

test('replaceUrl before any navigation creates the first entry', (t) => {
  const router = createRouter({ mode: 'memory', sync: true })
  router.replaceUrl('/b')
  t.is(router.getUrl(), '/b')
})

test('replaceUrl normalizes urls like navigate', (t) => {
  const router = createRouter({ mode: 'memory', sync: true })
  router.replaceUrl('#/b/')
  t.is(router.getUrl(), '/b')
  router.replaceUrl('b')
  t.is(router.getUrl(), '/b')
  router.replaceUrl('')
  t.is(router.getUrl(), '/')
})

test('a pending navigate emit observes a subsequent replaceUrl', async (t) => {
  const calls: string[] = []
  const router = createRouter({ mode: 'memory' })
  router.listen([{ path: '*' }], (route) => calls.push(route?.url ?? 'unmatched'))

  router.navigate('/a')
  router.replaceUrl('/b')

  await Promise.resolve()
  t.deepEqual(calls, ['/b'])
})

test('replaceUrl before listen does not throw', (t) => {
  const router = createRouter({ mode: 'memory', sync: true })
  t.notThrows(() => router.replaceUrl('/foo'))
  t.is(router.getUrl(), '/foo')
})

test('custom schedule controls when route changes are delivered', (t) => {
  const calls: string[] = []
  const fires: (() => void)[] = []
  const router = createRouter({ mode: 'memory', schedule: (fire) => fires.push(fire) })
  router.listen([{ path: '*' }], (route) => {
    calls.push(route?.url ?? 'unmatched')
  })

  router.navigate('/a')
  router.navigate('/b')
  t.deepEqual(calls, [])

  for (const fire of fires) fire()

  t.deepEqual(calls, ['/b'])
})

test('listen emits matched and unmatched urls with navigation metadata', (t) => {
  const calls: { url: string | undefined; traversal: boolean }[] = []
  const router = createRouter({ mode: 'memory', sync: true })
  router.listen([{ path: '/known' }], (route, info) => {
    calls.push({ url: route?.url, traversal: info.traversal })
  })

  router.navigate('/known')
  router.navigate('/unknown')

  t.deepEqual(calls, [
    { url: '/known', traversal: false },
    { url: undefined, traversal: false },
  ])
})

function renderRoute(route: Route<TestRouteData> | undefined): string {
  if (!route) throw new Error('Expected a matched route')
  const render = route.data[0].render
  if (!render) throw new Error(`Missing render metadata for ${route.pattern}`)
  return render(route.params, route.query, route.hash)
}

function createTestRouter(
  cb?: RouteChange,
  { withoutCatchAll = false }: TestRouterOptions = {},
): { router: Router<TestRouteData>; dispose: () => void } {
  const router = createRouter<TestRouteData>({ mode: 'memory', sync: true })
  const routes: RouteDefinition<TestRouteData>[] = [
    { path: '/foo', render: () => 'foo' },
    { path: '/bar', render: () => 'bar' },
    { path: '/redirect-via-obj-1', redirect: 'bar' },
    { path: '/redirect-via-obj-2', redirect: { pathname: '/user/:id', params: { id: 1 } } },
    { path: '/redirect-via-fn-1/:id', redirect: ({ params }) => ({ pathname: '/user/:id', params }) },
    { path: '/redirect-via-fn-2/:id', redirect: () => ({ url: '/foo' }) },
    {
      path: '/user/:id',
      render: (params, query, hash = '') => {
        const q = Object.keys(query).length ? `?${qs.stringify(query)}` : ''
        return 'user=' + params.id + q + hash
      },
    },
    { path: '/user/:id/friends', render: (params) => 'friends=' + params.id },
    { path: '/user/:id/settings', datum: 'settings-data' },
  ]

  if (!withoutCatchAll) {
    routes.push({ path: '*', render: () => 'catchall' })
  }

  const dispose = router.listen(routes, cb)
  return { router, dispose }
}
