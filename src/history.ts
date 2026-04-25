export type Mode = 'history' | 'hash' | 'memory'

export interface History {
  listen(onChange: (url: string, state: unknown) => void): () => void
  getUrl(): string
  push(url: string, state?: unknown): void
  replace(url: string, state?: unknown): void
}

export interface CreateHistoryOptions {
  mode?: Mode
  sync?: boolean
}

export function createHistory(options: CreateHistoryOptions = {}): History {
  const sync = !!options.sync
  let mode: Mode = options.mode || 'history'
  let listener: ((url: string, state: unknown) => void) | null = null
  let pending = false

  const memory: string[] = []
  const memoryStates: unknown[] = []

  if (typeof window === 'undefined') {
    mode = 'memory'
  }

  function emit() {
    if (listener) listener(getUrl(), getState())
  }

  function getState(): unknown {
    if (mode === 'memory') return memoryStates[memoryStates.length - 1]
    if (mode === 'history') return history.state
    return undefined
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

  function listen(onChange: (url: string, state: unknown) => void) {
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

  function go(url: string, replace?: boolean, state?: unknown) {
    url = url.replace(/^\/?#?\/?/, '/').replace(/\/$/, '') || '/'
    if (mode === 'history') {
      history[replace ? 'replaceState' : 'pushState'](state ?? null, '', url)
      schedule()
    } else if (mode === 'hash') {
      // hash mode has no native state support; the state argument is dropped.
      // hashchange only fires when the URL actually changes; if it doesn't,
      // we schedule the emit manually so navigation stays consistent with
      // history mode (where pushState is silent and we always schedule).
      const same = url === getUrl()
      location[replace ? 'replace' : 'assign']('#' + url)
      if (same) schedule()
    } else if (mode === 'memory') {
      if (replace) {
        memory[memory.length - 1] = url
        memoryStates[memoryStates.length - 1] = state
      } else {
        memory.push(url)
        memoryStates.push(state)
      }
      schedule()
    }
  }

  function getUrl(): string {
    if (mode === 'memory') {
      return memory[memory.length - 1]
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
    push(url, state) {
      go(url, false, state)
    },
    replace(url, state) {
      go(url, true, state)
    },
  }
}

function on(el: Window, type: string, fn: () => void) {
  el.addEventListener(type, fn, false)
  return function off() {
    el.removeEventListener(type, fn, false)
  }
}
