import test from 'ava'
import { createHistory } from '../src/history'

// history.js looks for `typeof window === 'undefined'` to pick memory vs browser
// mode. To exercise the history-mode getUrl path we briefly stand up a tiny
// DOM-ish global. We run serially so the globals don't leak across tests.
function withFakeDom(href, fn) {
  const previous = {
    window: globalThis.window,
    location: globalThis.location,
    history: globalThis.history,
    requestAnimationFrame: globalThis.requestAnimationFrame,
  }
  const url = new URL(href)
  globalThis.window = { addEventListener() {}, removeEventListener() {} }
  globalThis.location = { href, pathname: url.pathname, search: url.search }
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
