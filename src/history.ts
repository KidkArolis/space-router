export type Mode = 'history' | 'hash' | 'memory'

export interface History {
  listen(onChange: (url: string) => void): () => void
  getUrl(): string
  push(url: string): void
  replace(url: string): void
  replaceSilent(url: string): void
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

interface Subscription {
  listener: (url: string) => void
  off?: () => void
}

export function createHistory(options: CreateHistoryOptions = {}): History {
  const schedule: Schedule = options.schedule || (options.sync ? (fire) => fire() : (fire) => queueMicrotask(fire))
  let mode: Mode = options.mode || 'history'
  let active: Subscription | undefined
  let seq = 0
  let selfNavs = 0

  const memory: string[] = []

  if (typeof window === 'undefined') {
    mode = 'memory'
  }

  function emit() {
    active?.listener(getUrl())
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
    if (active) throw new Error('Already listening')

    const subscription: Subscription = { listener: onChange }
    active = subscription

    const dispose = () => {
      if (active !== subscription) return
      active = undefined
      seq++
      subscription.off?.()
    }

    try {
      if (mode !== 'memory') {
        subscription.off = on(window, mode === 'history' ? 'popstate' : 'hashchange', onTraversal)
        scheduleEmit(false)
      }
    } catch (error) {
      dispose()
      throw error
    }

    return dispose
  }

  function normalize(url: string) {
    return url.replace(/^\/?#?\/?/, '/').replace(/\/$/, '') || '/'
  }

  function go(url: string, replace?: boolean) {
    url = normalize(url)
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

  // replace the current entry without emitting — for callers that have
  // already committed a route and only need the url to agree. replaceState
  // fires no popstate/hashchange, so no emit needs suppressing; in hash mode
  // this is also why we can't reuse go()'s location.replace path, which does
  // fire hashchange and would emit.
  function replaceSilent(url: string) {
    url = normalize(url)
    if (mode === 'history') {
      history.replaceState({}, '', url)
    } else if (mode === 'hash') {
      // a bare fragment url leaves the page's pathname and search untouched
      history.replaceState({}, '', '#' + url)
    } else if (mode === 'memory') {
      if (memory.length) {
        memory[memory.length - 1] = url
      } else {
        memory.push(url)
      }
    }
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
    replaceSilent,
  }
}

function on(el: Window, type: string, fn: () => void) {
  el.addEventListener(type, fn, false)
  return function off() {
    el.removeEventListener(type, fn, false)
  }
}
