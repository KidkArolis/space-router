export interface Qs {
  parse(queryString: string): Record<string, string>
  stringify(query: Record<string, unknown>): string
}

export const qs: Qs = {
  parse(queryString) {
    return queryString.split('&').reduce<Record<string, string>>((acc, pair) => {
      if (!pair) return acc
      const i = pair.indexOf('=')
      const key = decode(i < 0 ? pair : pair.slice(0, i))
      const val = i < 0 ? '' : decode(pair.slice(i + 1))
      acc[key] = val
      return acc
    }, {})
  },

  stringify(query) {
    return Object.keys(query)
      .reduce<string[]>((acc, key) => {
        const value = query[key]
        if (value !== undefined) {
          acc.push(encodeURIComponent(key) + '=' + encodeURIComponent(value as string | number | boolean))
        }
        return acc
      }, [])
      .join('&')
  },
}

function decode(s: string): string {
  return decodeURIComponent(s.replace(/\+/g, ' '))
}
