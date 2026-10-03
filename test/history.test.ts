import test from 'ava'
import { createHistory } from '../src/history.ts'

type BrowserGlobal = 'window' | 'location' | 'history'
type BrowserEvent = 'hashchange' | 'popstate'
type EventHandler = (event: { oldURL?: string; newURL?: string }) => void

interface TraversalControls {
  back(url: string): void
}

interface HashControls extends TraversalControls {
  flush(): Promise<void>
  flushOne(): Promise<void>
}

function withBrowserGlobals<Result>(replacements: Record<BrowserGlobal, unknown>, fn: () => Result): Result {
  const names: BrowserGlobal[] = ['window', 'location', 'history']
  const previous = new Map<BrowserGlobal, PropertyDescriptor | undefined>()

  for (const name of names) {
    previous.set(name, Object.getOwnPropertyDescriptor(globalThis, name))
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value: replacements[name],
    })
  }

  try {
    return fn()
  } finally {
    for (const name of names) {
      const descriptor = previous.get(name)
      if (descriptor) {
        Object.defineProperty(globalThis, name, descriptor)
      } else {
        Reflect.deleteProperty(globalThis, name)
      }
    }
  }
}

function createFakeWindow() {
  const handlers: Record<BrowserEvent, EventHandler[]> = { hashchange: [], popstate: [] }
  return {
    window: {
      addEventListener(type: BrowserEvent, fn: EventHandler) {
        handlers[type].push(fn)
      },
      removeEventListener(type: BrowserEvent, fn: EventHandler) {
        const index = handlers[type].indexOf(fn)
        if (index >= 0) handlers[type].splice(index, 1)
      },
    },
    fire(type: BrowserEvent, event = {}) {
      for (const handler of handlers[type].slice()) handler(event)
    },
  }
}

// history.ts looks for `typeof window === 'undefined'` to pick memory vs browser
// mode. To exercise the browser-mode paths we briefly stand up a tiny DOM-ish
// global. We run serially so the globals don't leak across tests.
function withFakeDom<Result>(href: string, fn: () => Result): Result {
  const url = new URL(href)
  return withBrowserGlobals(
    {
      window: createFakeWindow().window,
      location: { href, pathname: url.pathname, search: url.search, hash: url.hash },
      history: { pushState() {}, replaceState() {} },
    },
    fn,
  )
}

// Richer fake DOM for hash-mode tests: addEventListener actually wires up
// listeners. Hash writes update location synchronously but queue separate
// hashchange tasks; flush runs a microtask checkpoint after each event.
async function withFakeHashDom(fn: (controls: HashControls) => void | Promise<void>): Promise<void> {
  let hash = ''
  const { window, fire } = createFakeWindow()
  const events: { oldURL: string; newURL: string }[] = []
  function change(target: string) {
    if (target === hash) return
    const oldURL = location.href
    hash = target
    events.push({ oldURL, newURL: location.href })
  }
  const location = {
    get href() {
      return 'http://x.com/' + hash
    },
    get hash() {
      return hash
    },
    pathname: '/',
    search: '',
    assign(target: string) {
      change(target)
    },
    replace(target: string) {
      change(target)
    },
  }
  const history = {
    pushState() {},
    // a bare fragment url replaces the hash without firing hashchange,
    // mirroring real browser behavior
    replaceState(_state: unknown, _title: string, url: string) {
      if (url.startsWith('#')) hash = url
    },
  }

  // simulates a browser back/forward traversal on a hash url
  function back(target: string) {
    change(target.startsWith('#') ? target : '#' + target)
  }

  async function flushOne() {
    // Microtasks from synchronous writes run before the first queued event.
    await Promise.resolve()
    const event = events.shift()
    if (event) fire('hashchange', event)
    await Promise.resolve()
  }

  async function flush() {
    await Promise.resolve()
    while (events.length) await flushOne()
  }

  // Keep the globals installed until all asynchronous checks finish.
  const previous = Object.fromEntries(
    ['window', 'location', 'history'].map((name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)]),
  )
  try {
    for (const [name, value] of Object.entries({ window, location, history })) {
      Object.defineProperty(globalThis, name, { configurable: true, writable: true, value })
    }
    await fn({ back, flush, flushOne })
  } finally {
    for (const [name, descriptor] of Object.entries(previous)) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor)
      else Reflect.deleteProperty(globalThis, name)
    }
  }
}

// Fake DOM for history-mode scheduling tests: addEventListener is wired up,
// pushState/replaceState update the url silently (as in real browsers), and
// back() simulates a browser traversal by updating the url and firing popstate.
function withFakeHistoryDom<Result>(fn: (controls: TraversalControls) => Result): Result {
  let current = '/'
  const { window, fire } = createFakeWindow()
  const location = {
    get pathname() {
      return current.split(/[?#]/)[0]
    },
    get search() {
      const m = current.match(/\?[^#]*/)
      return m ? m[0] : ''
    },
    get hash() {
      const i = current.indexOf('#')
      return i >= 0 ? current.slice(i) : ''
    },
  }
  const history = {
    pushState(_state: unknown, _title: string, url: string) {
      current = url
    },
    replaceState(_state: unknown, _title: string, url: string) {
      current = url
    },
  }

  function back(url: string) {
    current = url
    fire('popstate')
  }

  return withBrowserGlobals({ window, location, history }, () => fn({ back }))
}

test.serial('getUrl in history mode preserves a # inside the hash fragment', (t) => {
  withFakeDom('http://x.com/path#foo#bar', () => {
    const h = createHistory({ mode: 'history', sync: true })
    t.is(h.getUrl(), '/path#foo#bar')
  })
})

test.serial('getUrl in history mode returns just pathname when no hash', (t) => {
  withFakeDom('http://x.com/path', () => {
    const h = createHistory({ mode: 'history', sync: true })
    t.is(h.getUrl(), '/path')
  })
})

test('memory mode getUrl returns an empty string before any navigation', (t) => {
  const h = createHistory({ mode: 'memory', sync: true })
  t.is(h.getUrl(), '')
})

test('memory mode replace before any push creates the first entry', (t) => {
  const h = createHistory({ mode: 'memory', sync: true })
  h.replace('/foo')
  t.is(h.getUrl(), '/foo')
  h.push('/bar')
  t.is(h.getUrl(), '/bar')
})

test('an old disposer cannot remove a newer listener', (t) => {
  const calls: string[] = []
  const h = createHistory({ mode: 'memory', sync: true })
  const disposeFirst = h.listen((url) => calls.push('first:' + url))

  disposeFirst()
  const disposeSecond = h.listen((url) => calls.push('second:' + url))
  disposeFirst()
  h.push('/a')

  t.deepEqual(calls, ['second:/a'])
  disposeSecond()
})

test('disposing invalidates pending delivery before a new listener attaches', async (t) => {
  const calls: string[] = []
  const h = createHistory({ mode: 'memory' })
  const disposeFirst = h.listen((url) => calls.push('first:' + url))

  h.push('/a')
  disposeFirst()
  const disposeSecond = h.listen((url) => calls.push('second:' + url))
  await Promise.resolve()

  t.deepEqual(calls, [])
  h.push('/b')
  await Promise.resolve()
  t.deepEqual(calls, ['second:/b'])
  disposeSecond()
})

test.serial('a throwing initial listener does not poison future subscriptions', (t) => {
  withFakeHistoryDom(() => {
    const h = createHistory({ mode: 'history', sync: true })
    t.throws(
      () =>
        h.listen(() => {
          throw new Error('initial listener failed')
        }),
      { message: 'initial listener failed' },
    )

    const calls: string[] = []
    const dispose = h.listen((url) => calls.push(url))
    t.deepEqual(calls, ['/'])
    dispose()
  })
})

test.serial('hash mode emits when navigating to the current URL', async (t) => {
  const calls: string[] = []
  await withFakeHashDom(async ({ flush }) => {
    const h = createHistory({ mode: 'hash', sync: true })
    h.listen((url) => calls.push(url))
    h.push('/foo') // different from current ('/'), synchronous write schedules the emit
    h.push('/foo') // same as current, no hashchange — manual schedule drives the emit
    await flush()
  })
  t.deepEqual(calls, ['/', '/foo', '/foo'])
})

test.serial('history mode scheduler receives traversal true only for popstate', (t) => {
  const seen: boolean[] = []
  const calls: string[] = []
  withFakeHistoryDom(({ back }) => {
    const h = createHistory({
      mode: 'history',
      schedule: (fire, { traversal }) => {
        seen.push(traversal)
        fire()
      },
    })
    h.listen((url) => calls.push(url))
    h.push('/a')
    h.replace('/b')
    back('/')
  })
  t.deepEqual(seen, [false, false, false, true])
  t.deepEqual(calls, ['/', '/a', '/b', '/'])
})

test.serial('history listener receives initial, navigation, and traversal metadata', (t) => {
  const calls: { url: string; traversal: boolean }[] = []
  withFakeHistoryDom(({ back }) => {
    const h = createHistory({ mode: 'history', sync: true })
    h.listen((url, info) => calls.push({ url, traversal: info.traversal }))
    h.push('/a')
    h.replace('/b')
    back('/')
  })
  t.deepEqual(calls, [
    { url: '/', traversal: false },
    { url: '/a', traversal: false },
    { url: '/b', traversal: false },
    { url: '/', traversal: true },
  ])
})

test.serial('hash mode scheduler receives traversal false for own push, true for external hashchange', async (t) => {
  const seen: boolean[] = []
  const calls: string[] = []
  await withFakeHashDom(async ({ back, flush }) => {
    const h = createHistory({
      mode: 'hash',
      schedule: (fire, { traversal }) => {
        seen.push(traversal)
        fire()
      },
    })
    h.listen((url) => calls.push(url))
    h.push('/foo') // fires hashchange, but it's our own navigation
    h.push('/foo') // no hashchange, manual schedule
    back('/') // back/forward traversal
    await flush()
  })
  t.deepEqual(seen, [false, false, false, true])
  t.deepEqual(calls, ['/', '/foo', '/foo', '/'])
})

test.serial('hash listener distinguishes self-created hash changes from traversal', async (t) => {
  const calls: { url: string; traversal: boolean }[] = []
  await withFakeHashDom(async ({ back, flush }) => {
    const h = createHistory({ mode: 'hash', sync: true })
    h.listen((url, info) => calls.push({ url, traversal: info.traversal }))
    h.push('/foo')
    h.push('/foo')
    back('/')
    await flush()
  })
  t.deepEqual(calls, [
    { url: '/', traversal: false },
    { url: '/foo', traversal: false },
    { url: '/foo', traversal: false },
    { url: '/', traversal: true },
  ])
})

test.serial('a push racing a deferred traversal emit results in a single emit of the final url', (t) => {
  const calls: { url: string; traversal: boolean }[] = []
  withFakeHistoryDom(({ back }) => {
    const deferred: (() => void)[] = []
    const h = createHistory({
      mode: 'history',
      schedule: (fire, { traversal }) => (traversal ? deferred.push(fire) : fire()),
    })
    h.listen((url, info) => calls.push({ url, traversal: info.traversal }))
    calls.length = 0 // ignore the initial emit
    back('/away')
    t.deepEqual(calls, [], 'deferred traversal emit did not fire within the event task')
    h.push('/pushed') // races the deferred fire, supersedes it
    t.deepEqual(calls, [{ url: '/pushed', traversal: false }])
    for (const fire of deferred) fire() // stale fires no-op
  })
  t.deepEqual(calls, [{ url: '/pushed', traversal: false }])
})

test.serial('a deferred traversal emit fires with the current url when not superseded', (t) => {
  const calls: string[] = []
  withFakeHistoryDom(({ back }) => {
    const deferred: (() => void)[] = []
    const h = createHistory({
      mode: 'history',
      schedule: (fire, { traversal }) => (traversal ? deferred.push(fire) : fire()),
    })
    h.listen((url) => calls.push(url))
    calls.length = 0
    back('/away')
    for (const fire of deferred) fire()
  })
  t.deepEqual(calls, ['/away'])
})

for (const mode of ['history', 'hash', 'memory'] as const) {
  test.serial(`${mode} navigation preserves query and fragment slashes`, async (t) => {
    function check() {
      const h = createHistory({ mode, sync: true })
      const calls: string[] = []
      const dispose = h.listen((url) => calls.push(url))
      calls.length = 0
      h.push('/login/?returnTo=/')
      t.is(h.getUrl(), '/login?returnTo=/')
      h.replace('/docs/#section/')
      t.is(h.getUrl(), '/docs#section/')
      h.replaceSilent('/docs/?returnTo=/#section/')
      t.is(h.getUrl(), '/docs?returnTo=/#section/')
      t.deepEqual(calls, ['/login?returnTo=/', '/docs#section/'])
      dispose()
    }

    if (mode === 'history') withFakeHistoryDom(check)
    else if (mode === 'hash')
      await withFakeHashDom(async ({ flush }) => {
        check()
        await flush()
      })
    else check()
  })
}

test('a burst of pushes coalesces into a single emit with the default scheduler', async (t) => {
  const calls: string[] = []
  const h = createHistory({ mode: 'memory' })
  h.listen((url) => calls.push(url))
  h.push('/a')
  h.push('/b')
  h.push('/c')
  t.deepEqual(calls, [])
  await Promise.resolve()
  t.deepEqual(calls, ['/c'])
})

test.serial('hash writes coalesce before queued hashchange tasks and never emit again from those tasks', async (t) => {
  await withFakeHashDom(async ({ flushOne, flush }) => {
    const calls: { url: string; traversal: boolean }[] = []
    const h = createHistory({ mode: 'hash' })
    h.listen((url, info) => calls.push({ url, ...info }))
    h.push('/a')
    h.replace('/b')
    h.push('/c')
    t.is(h.getUrl(), '/c', 'location updates synchronously')
    t.deepEqual(calls, [])
    await Promise.resolve()
    t.deepEqual(calls, [{ url: '/c', traversal: false }], 'initial emit is superseded too')
    await flushOne()
    await flush()
    t.deepEqual(calls, [{ url: '/c', traversal: false }])
  })
})

for (const navigation of ['push', 'replace'] as const) {
  test.serial(`hash ${navigation} before listening does not leak suppression into later traversals`, async (t) => {
    await withFakeHashDom(async ({ back, flush }) => {
      const h = createHistory({ mode: 'hash', sync: true })
      h[navigation]('/a')
      const calls: { url: string; traversal: boolean }[] = []
      h.listen((url, info) => calls.push({ url, ...info }))
      await flush()
      t.deepEqual(calls, [{ url: '/a', traversal: false }], 'old queued event does not reach new listener')
      back('/')
      await flush()
      t.deepEqual(calls, [
        { url: '/a', traversal: false },
        { url: '/', traversal: true },
      ])
    })
  })
}

test.serial('hash navigation tasks drained without a listener cannot poison a later subscription', async (t) => {
  await withFakeHashDom(async ({ back, flush }) => {
    const h = createHistory({ mode: 'hash', sync: true })
    h.push('/before')
    await flush()
    const dispose = h.listen(() => {})
    h.replace('/disposed')
    dispose()
    await flush()
    const calls: { url: string; traversal: boolean }[] = []
    h.listen((url, info) => calls.push({ url, ...info }))
    back('/')
    await flush()
    t.deepEqual(calls, [
      { url: '/disposed', traversal: false },
      { url: '/', traversal: true },
    ])
  })
})

test.serial('queued external hash changes observe only the final changed URL', async (t) => {
  await withFakeHashDom(async ({ back, flush }) => {
    const calls: { url: string; traversal: boolean }[] = []
    const h = createHistory({ mode: 'hash' })
    h.listen((url, info) => calls.push({ url, ...info }))
    await flush()
    calls.length = 0
    back('/a')
    back('/b')
    await flush()
    t.deepEqual(calls, [{ url: '/b', traversal: true }])
    back('/a')
    back('/b')
    await flush()
    t.deepEqual(calls, [{ url: '/b', traversal: true }], 'a net-zero burst has no new URL to deliver')
  })
})

test.serial('hash disposal and reattachment ignore old navigation and traversal tasks', async (t) => {
  await withFakeHashDom(async ({ back, flush }) => {
    const h = createHistory({ mode: 'hash', sync: true })
    const old: string[] = []
    const dispose = h.listen((url) => old.push(url))
    h.push('/a')
    back('/b')
    dispose()
    const calls: { url: string; traversal: boolean }[] = []
    h.listen((url, info) => calls.push({ url, ...info }))
    await flush()
    t.deepEqual(old, ['/', '/a'])
    t.deepEqual(calls, [{ url: '/b', traversal: false }])
    back('/a')
    await flush()
    t.deepEqual(calls, [
      { url: '/b', traversal: false },
      { url: '/a', traversal: true },
    ])
  })
})

test.serial('hash traversal supersedes pending navigation with traversal metadata', async (t) => {
  await withFakeHashDom(async ({ back, flush }) => {
    const calls: { url: string; traversal: boolean }[] = []
    const deferred: (() => void)[] = []
    const seen: boolean[] = []
    const h = createHistory({
      mode: 'hash',
      schedule: (fire, { traversal }) => {
        seen.push(traversal)
        deferred.push(fire)
      },
    })
    h.listen((url, info) => calls.push({ url, ...info }))
    h.push('/a')
    back('/')
    await flush()
    for (const fire of deferred) fire()
    t.deepEqual(seen, [false, false, true])
    t.deepEqual(calls, [{ url: '/', traversal: true }])
  })
})

test.serial('hash push supersedes a custom deferred traversal emit', async (t) => {
  await withFakeHashDom(async ({ back, flush }) => {
    const calls: { url: string; traversal: boolean }[] = []
    const deferred: (() => void)[] = []
    const h = createHistory({
      mode: 'hash',
      schedule: (fire, { traversal }) => (traversal ? deferred.push(fire) : fire()),
    })
    h.listen((url, info) => calls.push({ url, ...info }))
    calls.length = 0
    back('/away')
    await flush()
    t.deepEqual(calls, [])
    h.push('/pushed')
    await flush()
    for (const fire of deferred) fire()
    t.deepEqual(calls, [{ url: '/pushed', traversal: false }])
  })
})

test.serial('hash replaceSilent suppresses queued changes even when it restores their target URL', async (t) => {
  await withFakeHashDom(async ({ back, flush }) => {
    const calls: string[] = []
    const h = createHistory({ mode: 'hash', sync: true })
    h.listen((url) => calls.push(url))
    back('/a')
    back('/b')
    h.replaceSilent('/a')
    await flush()
    t.deepEqual(calls, ['/'])
  })
})

test('explicit schedule takes precedence over sync', (t) => {
  const seen: boolean[] = []
  const calls: string[] = []
  const h = createHistory({
    mode: 'memory',
    sync: true,
    schedule: (fire, { traversal }) => {
      seen.push(traversal)
      fire()
    },
  })
  h.listen((url) => calls.push(url))
  h.push('/a')
  t.deepEqual(seen, [false])
  t.deepEqual(calls, ['/a'])
})

test.serial('replaceSilent in history mode updates the url without scheduling an emit', (t) => {
  const calls: string[] = []
  const fires: (() => void)[] = []
  withFakeHistoryDom(() => {
    const h = createHistory({ mode: 'history', schedule: (fire) => fires.push(fire) })
    h.listen((url) => calls.push(url))
    for (const fire of fires.splice(0)) fire() // flush the initial emit
    h.replaceSilent('/b?x=1')
    t.is(h.getUrl(), '/b?x=1')
    t.deepEqual(fires, [], 'no emit was scheduled')
  })
  t.deepEqual(calls, ['/'])
})

test.serial('replaceSilent in hash mode rewrites only the fragment without emitting', async (t) => {
  const calls: string[] = []
  await withFakeHashDom(async ({ flush }) => {
    const h = createHistory({ mode: 'hash', sync: true })
    h.listen((url) => calls.push(url))
    h.push('/a')
    calls.length = 0
    h.replaceSilent('/b?x=1')
    t.is(location.hash, '#/b?x=1')
    t.is(location.pathname + location.search, '/', 'path and search untouched')
    t.is(h.getUrl(), '/b?x=1')
    await flush()
  })
  t.deepEqual(calls, [], 'no hashchange fired, no emit scheduled')
})

test.serial('replaceSilent before listen is reflected by the initial emit', (t) => {
  const calls: string[] = []
  withFakeHistoryDom(() => {
    const h = createHistory({ mode: 'history', sync: true })
    h.replaceSilent('/b')
    h.listen((url) => calls.push(url))
  })
  t.deepEqual(calls, ['/b'])
})

test('memory mode never schedules a traversal emit', (t) => {
  const seen: boolean[] = []
  const h = createHistory({
    mode: 'memory',
    schedule: (fire, { traversal }) => {
      seen.push(traversal)
      fire()
    },
  })
  h.listen(() => {})
  h.push('/a')
  h.replace('/b')
  h.push('/c')
  t.deepEqual(seen, [false, false, false])
})
