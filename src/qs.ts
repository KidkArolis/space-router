export interface Qs {
  parse(queryString: string): Record<string, string>
  stringify(query: Record<string, unknown>): string
}

export const qs: Qs = {
  parse(queryString) {
    return Object.fromEntries(new URLSearchParams(queryString))
  },

  stringify(query) {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) params.append(key, String(value))
    }
    return params.toString()
  },
}
