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
  try {
    return fn()
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
