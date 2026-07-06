export type Mode = 'history' | 'hash' | 'memory'

export interface History {
  listen(onChange: (url: string) => void): () => void
  getUrl(): string
  push(url: string): void
  replace(url: string): void
}

export interface ScheduleInfo {
  traversal: boolean
}

export type Schedule = (fire: () => void, info: ScheduleInfo) => void

export interface CreateHistoryOptions {
  mode?: Mode
  sync?: boolean
  schedule?: Schedule
}

export function createHistory(options: CreateHistoryOptions = {}): History {
  const schedule: Schedule = options.schedule || (options.sync ? (fire) => fire() : (fire) => queueMicrotask(fire))
  let mode: Mode = options.mode || 'history'
  let listener: ((url: string) => void) | null = null
  let seq = 0
  let selfNavs = 0

  const memory: string[] = []

  if (typeof window === 'undefined') {
    mode = 'memory'
  }

  function emit() {
    if (listener) listener(getUrl())
  }

  // each scheduled fire captures its seq: superseded fires no-op, and the
  // surviving one reads the url fresh in emit() — so racing schedules of any
  // mix (e.g. a deferred traversal emit overtaken by a push's microtask emit)
  // coalesce into a single emit of the final url
  function scheduleEmit(traversal: boolean) {
    const s = ++seq
    schedule(
      () => {
        if (s === seq) emit()
      },
      { traversal },
    )
  }

  function onTraversal() {
    // a hashchange caused by our own push/replace is a navigation,
    // not a back/forward traversal
    const traversal = selfNavs === 0
    if (selfNavs > 0) selfNavs--
    scheduleEmit(traversal)
  }

  function listen(onChange: (url: string) => void) {
    if (listener) throw new Error('Already listening')
    listener = onChange
    let off: (() => void) | undefined
    if (mode !== 'memory') {
      off = on(window, mode === 'history' ? 'popstate' : 'hashchange', onTraversal)
      scheduleEmit(false)
    }
    return () => {
      listener = null
      if (off) off()
    }
  }

  function go(url: string, replace?: boolean) {
    url = url.replace(/^\/?#?\/?/, '/').replace(/\/$/, '') || '/'
    if (mode === 'history') {
      history[replace ? 'replaceState' : 'pushState']({}, '', url)
      scheduleEmit(false)
    } else if (mode === 'hash') {
      // hashchange only fires when the URL actually changes; if it doesn't,
      // we schedule the emit manually so navigation stays consistent with
      // history mode (where pushState is silent and we always schedule).
      const same = url === getUrl()
      if (!same) selfNavs++
      location[replace ? 'replace' : 'assign']('#' + url)
      if (same) scheduleEmit(false)
    } else if (mode === 'memory') {
      if (replace && memory.length) {
        memory[memory.length - 1] = url
      } else {
        memory.push(url)
      }
      scheduleEmit(false)
    }
  }

  function getUrl(): string {
    if (mode === 'memory') {
      return memory[memory.length - 1] ?? ''
    }

    const hash = getHash()
    if (mode === 'hash') {
      return hash === '' ? '/' : hash
    }

    let url = location.pathname + location.search
    if (hash !== '') {
      url += '#' + hash
    }

    return url
  }

  function getHash() {
    return location.hash.slice(1)
  }

  return {
    listen,
    getUrl,
    push(url) {
      go(url)
    },
    replace(url) {
      go(url, true)
    },
  }
}

function on(el: Window, type: string, fn: () => void) {
  el.addEventListener(type, fn, false)
  return function off() {
    el.removeEventListener(type, fn, false)
  }
}
