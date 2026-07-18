import type { Qs } from './qs.ts'

export interface MatchedRoute {
  pattern: string
  url: string
  pathname: string
  params: Record<string, string>
  query: Record<string, string>
  search: string
  hash: string
}

export function matchOne(pattern: string, url: string, qs?: Qs): MatchedRoute | undefined {
  if (!pattern) return

  const re = /(?:\?([^#]*))?(#.*)?$/
  const originalUrl = url
  const originalPattern = pattern
  const c = url.match(re)
  const params: Record<string, string> = {}
  let query: Record<string, string> = {}
  let search = ''
  let hash = ''

  if (c && c[1]) {
    search = '?' + c[1]
    query = qs ? qs.parse(c[1]) : {}
  }

  if (c && c[2]) {
    hash = c[2]
  }

  if (pattern !== '*') {
    const urlSegs = segmentize(url.replace(re, ''))
    const patSegs = segmentize(pattern)
    const max = Math.max(urlSegs.length, patSegs.length)
    for (let i = 0; i < max; i++) {
      const ps = patSegs[i]
      if (ps && ps.charAt(0) === ':') {
        const param = ps.replace(/(^:|[+*?]+$)/g, '')
        const flags = ps.match(/[+*?]+$/)?.[0] ?? ''
        const plus = flags.indexOf('+') > -1
        const star = flags.indexOf('*') > -1
        const val = urlSegs[i] || ''
        if (!val && !star && (flags.indexOf('?') < 0 || plus)) return

        params[param] = decode(val)
        if (plus || star) {
          params[param] = urlSegs.slice(i).map(decode).join('/')
          break
        }
      } else if (ps !== urlSegs[i]) {
        return
      }
    }
  }

  return {
    pattern: originalPattern,
    url: originalUrl,
    pathname: originalUrl.replace(re, ''),
    params,
    query,
    search,
    hash,
  }
}

// malformed percent-encoding (e.g. '%zz' typed into the address bar) must
// not crash the router — fall back to the raw segment
function decode(s: string): string {
  try {
    return decodeURIComponent(s)
  } catch {
    return s
  }
}

function segmentize(url: string): string[] {
  return strip(url).split('/')
}

function strip(url: string): string {
  return url.replace(/(^\/+|\/+$)/g, '')
}
