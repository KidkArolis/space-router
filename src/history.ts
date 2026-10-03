export type Mode = 'history' | 'hash' | 'memory'

export interface History {
  listen(onChange: (url: string, info: NavigationInfo) => void): () => void
  getUrl(): string
  push(url: string): void
  replace(url: string): void
  replaceSilent(url: string): void
}

export interface NavigationInfo {
  traversal: boolean
}

export type ScheduleInfo = NavigationInfo

export type Schedule = (fire: () => void, info: ScheduleInfo) => void

export interface CreateHistoryOptions {
  mode?: Mode
  sync?: boolean
  schedule?: Schedule
}

interface Subscription {
  listener: (url: string, info: NavigationInfo) => void
  off?: () => void
  hashUrl?: string
}

export function createHistory(options: CreateHistoryOptions = {}): History {
  const schedule: Schedule = options.schedule || (options.sync ? (fire) => fire() : (fire) => queueMicrotask(fire))
  let mode: Mode = options.mode || 'history'
  let active: Subscription | undefined
  let seq = 0

  let memoryUrl = ''

  if (typeof window === 'undefined') {
    mode = 'memory'
  }

  function emit(info: NavigationInfo) {
    active?.listener(getUrl(), info)
  }

  // each scheduled fire captures its seq: superseded fires no-op, and the
  // surviving one reads the url fresh in emit() — so racing schedules of any
  // mix (e.g. a deferred traversal emit overtaken by a push's microtask emit)
  // coalesce into a single emit of the final url
  function scheduleEmit(traversal: boolean) {
    const s = ++seq
    const info = { traversal }
    schedule(() => {
      if (s === seq) emit(info)
    }, info)
  }

  function listen(onChange: (url: string, info: NavigationInfo) => void) {
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
        subscription.hashUrl = location.href
        subscription.off = on(window, mode === 'history' ? 'popstate' : 'hashchange', (event) => {
          if (mode === 'hash') {
            const url = (event as HashChangeEvent).newURL
            // Hash writes are synchronous, but events arrive in later tasks.
            // Ignore superseded URLs and changes already observed by a write
            // or this subscription's initial emit (including old queued events).
            if (url !== location.href || url === subscription.hashUrl) return
            subscription.hashUrl = url
          }
          scheduleEmit(true)
        })
        scheduleEmit(false)
      }
    } catch (error) {
      dispose()
      throw error
    }

    return dispose
  }

  function go(url: string, replace?: boolean) {
    url = normalizeRouteUrl(url)
    if (mode === 'history') {
      history[replace ? 'replaceState' : 'pushState']({}, '', url)
      scheduleEmit(false)
    } else if (mode === 'hash') {
      location[replace ? 'replace' : 'assign']('#' + url)
      if (active) active.hashUrl = location.href
      scheduleEmit(false)
    } else if (mode === 'memory') {
      memoryUrl = url
      scheduleEmit(false)
    }
  }

  function getUrl(): string {
    if (mode === 'memory') {
      return memoryUrl
    }

    if (mode === 'hash') {
      return location.hash.slice(1) || '/'
    }

    return location.pathname + location.search + location.hash
  }

  // replace the current entry without emitting — for callers that have
  // already committed a route and only need the url to agree. replaceState
  // fires no popstate/hashchange, so no emit needs suppressing; in hash mode
  // this is also why we can't reuse go()'s location.replace path, which does
  // fire hashchange and would emit.
  function replaceSilent(url: string) {
    url = normalizeRouteUrl(url)
    if (mode === 'history') {
      history.replaceState({}, '', url)
    } else if (mode === 'hash') {
      // a bare fragment url leaves the page's pathname and search untouched
      history.replaceState({}, '', '#' + url)
      if (active) active.hashUrl = location.href
    } else if (mode === 'memory') {
      memoryUrl = url
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

export function normalizeRouteUrl(url: string): string {
  url = url.replace(/^\/?(?:#\/)?/, '/')
  const suffixIndex = url.search(/[?#]/)
  const pathname = suffixIndex < 0 ? url : url.slice(0, suffixIndex)
  const suffix = suffixIndex < 0 ? '' : url.slice(suffixIndex)
  return (pathname.replace(/\/$/, '') || '/') + suffix
}

function on(el: Window, type: string, fn: (event: Event) => void) {
  el.addEventListener(type, fn, false)
  return function off() {
    el.removeEventListener(type, fn, false)
  }
}
