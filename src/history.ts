export type Mode = 'history' | 'hash' | 'memory'

export interface History {
  listen(onChange: (url: string) => void): () => void
  getUrl(): string
  push(url: string): void
  replace(url: string): void
}

export interface CreateHistoryOptions {
  mode?: Mode
  sync?: boolean
}

export function createHistory(options: CreateHistoryOptions = {}): History {
  const sync = !!options.sync
  let mode: Mode = options.mode || 'history'
  let listener: ((url: string) => void) | null = null
  let pending = false

  const memory: string[] = []

  if (typeof window === 'undefined') {
    mode = 'memory'
  }

  function emit() {
    if (listener) listener(getUrl())
  }

  function schedule() {
    if (sync) return emit()
    if (pending) return
    pending = true
    queueMicrotask(() => {
      pending = false
      emit()
    })
  }

  function listen(onChange: (url: string) => void) {
    if (listener) throw new Error('Already listening')
    listener = onChange
    let off: (() => void) | undefined
    if (mode !== 'memory') {
      off = on(window, mode === 'history' ? 'popstate' : 'hashchange', schedule)
      schedule()
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
      schedule()
    } else if (mode === 'hash') {
      // hashchange only fires when the URL actually changes; if it doesn't,
      // we schedule the emit manually so navigation stays consistent with
      // history mode (where pushState is silent and we always schedule).
      const same = url === getUrl()
      location[replace ? 'replace' : 'assign']('#' + url)
      if (same) schedule()
    } else if (mode === 'memory') {
      if (replace && memory.length) {
        memory[memory.length - 1] = url
      } else {
        memory.push(url)
      }
      schedule()
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
