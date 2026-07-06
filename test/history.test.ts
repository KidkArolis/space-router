import test from 'ava'
import { createHistory } from '../src/history.ts'

// history.ts looks for `typeof window === 'undefined'` to pick memory vs browser
// mode. To exercise the browser-mode paths we briefly stand up a tiny DOM-ish
// global. We run serially so the globals don't leak across tests.
function withFakeDom(href, fn) {
  const previous = {
    window: globalThis.window,
    location: globalThis.location,
    history: globalThis.history,
    requestAnimationFrame: globalThis.requestAnimationFrame,
  }
  const url = new URL(href)
  globalThis.window = { addEventListener() {}, removeEventListener() {} }
  globalThis.location = { href, pathname: url.pathname, search: url.search, hash: url.hash }
  globalThis.history = { pushState() {}, replaceState() {} }
  globalThis.requestAnimationFrame = (cb) => cb()
  try {
    return fn()
  } finally {
    globalThis.window = previous.window
    globalThis.location = previous.location
    globalThis.history = previous.history
    globalThis.requestAnimationFrame = previous.requestAnimationFrame
  }
}

// Richer fake DOM for hash-mode tests: addEventListener actually wires up
// listeners, and location.assign/replace fire hashchange iff the hash changes
// (mirroring real browser behavior).
function withFakeHashDom(fn) {
  const previous = {
    window: globalThis.window,
    location: globalThis.location,
    history: globalThis.history,
  }
  let hash = ''
  const handlers = {}
  globalThis.window = {
    addEventListener(type, fn) {
      ;(handlers[type] ||= []).push(fn)
    },
    removeEventListener(type, fn) {
      const list = handlers[type] || []
      const i = list.indexOf(fn)
      if (i >= 0) list.splice(i, 1)
    },
  }
  globalThis.location = {
    get href() {
      return 'http://x.com/' + hash
    },
    get hash() {
      return hash
    },
    pathname: '/',
    search: '',
    assign(target) {
      if (target !== hash) {
        hash = target
        for (const f of handlers.hashchange || []) f()
      }
    },
    replace(target) {
      if (target !== hash) {
        hash = target
        for (const f of handlers.hashchange || []) f()
      }
    },
  }
  globalThis.history = { pushState() {}, replaceState() {} }
  // simulates a browser back/forward traversal on a hash url
  function back(target) {
    hash = target
    for (const f of handlers.hashchange || []) f()
  }
  try {
    return fn({ back })
  } finally {
    globalThis.window = previous.window
    globalThis.location = previous.location
    globalThis.history = previous.history
  }
}

// Fake DOM for history-mode scheduling tests: addEventListener is wired up,
// pushState/replaceState update the url silently (as in real browsers), and
// back() simulates a browser traversal by updating the url and firing popstate.
function withFakeHistoryDom(fn) {
  const previous = {
    window: globalThis.window,
    location: globalThis.location,
    history: globalThis.history,
  }
  let current = '/'
  const handlers = {}
  globalThis.window = {
    addEventListener(type, fn) {
      ;(handlers[type] ||= []).push(fn)
    },
    removeEventListener(type, fn) {
      const list = handlers[type] || []
      const i = list.indexOf(fn)
      if (i >= 0) list.splice(i, 1)
    },
  }
  globalThis.location = {
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
  globalThis.history = {
    pushState(_state, _title, url) {
      current = url
    },
    replaceState(_state, _title, url) {
      current = url
    },
  }
  function back(url) {
    current = url
    for (const f of handlers.popstate || []) f()
  }
  try {
    return fn({ back })
  } finally {
    globalThis.window = previous.window
    globalThis.location = previous.location
    globalThis.history = previous.history
  }
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

test.serial('hash mode emits when navigating to the current URL', (t) => {
  const calls = []
  withFakeHashDom(() => {
    const h = createHistory({ mode: 'hash', sync: true })
    h.listen((url) => calls.push(url))
    h.push('/foo') // different from current ('/'), browser hashchange drives the emit
    h.push('/foo') // same as current, no hashchange — manual schedule drives the emit
  })
  t.deepEqual(calls, ['/', '/foo', '/foo'])
})

test.serial('history mode scheduler receives traversal true only for popstate', (t) => {
  const seen = []
  const calls = []
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

test.serial('hash mode scheduler receives traversal false for own push, true for external hashchange', (t) => {
  const seen = []
  const calls = []
  withFakeHashDom(({ back }) => {
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
  })
  t.deepEqual(seen, [false, false, false, true])
  t.deepEqual(calls, ['/', '/foo', '/foo', '/'])
})

test.serial('a push racing a deferred traversal emit results in a single emit of the final url', (t) => {
  const calls = []
  withFakeHistoryDom(({ back }) => {
    const deferred = []
    const h = createHistory({
      mode: 'history',
      schedule: (fire, { traversal }) => (traversal ? deferred.push(fire) : fire()),
    })
    h.listen((url) => calls.push(url))
    calls.length = 0 // ignore the initial emit
    back('/away')
    t.deepEqual(calls, [], 'deferred traversal emit did not fire within the event task')
    h.push('/pushed') // races the deferred fire, supersedes it
    t.deepEqual(calls, ['/pushed'])
    for (const fire of deferred) fire() // stale fires no-op
  })
  t.deepEqual(calls, ['/pushed'])
})

test.serial('a deferred traversal emit fires with the current url when not superseded', (t) => {
  const calls = []
  withFakeHistoryDom(({ back }) => {
    const deferred = []
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

test('a burst of pushes coalesces into a single emit with the default scheduler', async (t) => {
  const calls = []
  const h = createHistory({ mode: 'memory' })
  h.listen((url) => calls.push(url))
  h.push('/a')
  h.push('/b')
  h.push('/c')
  t.deepEqual(calls, [])
  await Promise.resolve()
  t.deepEqual(calls, ['/c'])
})

test('explicit schedule takes precedence over sync', (t) => {
  const seen = []
  const calls = []
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

test('memory mode never schedules a traversal emit', (t) => {
  const seen = []
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
