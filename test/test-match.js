const { eq } = require('@briancavalier/assert')
const match = require('../src/match').matchOne

suite('match')

test('match explicit equality', () => {
  eq(match('/', '/').params, {})
  eq(match('/a', '/a').params, {})
  eq(match('/a', '/b'), false)
  eq(match('/a/b', '/a/b').params, {})
  eq(match('/a/b', '/a/a'), false)
  eq(match('/a/b', '/b/b'), false)
})

test('match param segments', () => {
  eq(match('/:foo', '/'), false)
  eq(match('/:foo', '/bar').params, { foo: 'bar' })
  eq(match('/bar/:foo', '/bar/baz').params, { foo: 'baz' })
})

test('match optional param segments', () => {
  eq(match('/:foo?', '/').params, { foo: '' })
  eq(match('/:foo?', '/bar').params, { foo: 'bar' })
  eq(match('/:foo?/:bar?', '/').params, { foo: '', bar: '' })
  eq(match('/:foo?/:bar?', '/bar').params, { foo: 'bar', bar: '' })
  eq(match('/:foo?/bar', '/bar'), false)
  eq(match('/:foo?/bar', '/foo/bar').params, { foo: 'foo' })
})

test('match splat param segments', () => {
  eq(match('/:foo*', '/').params, { foo: '' })
  eq(match('/:foo*', '/a').params, { foo: 'a' })
  eq(match('/:foo*', '/a/b').params, { foo: 'a/b' })
  eq(match('/:foo*', '/a/b/c').params, { foo: 'a/b/c' })
})

test('match required splat param segments', () => {
  eq(match('/:foo+', '/'), false)
  eq(match('/:foo+', '/a').params, { foo: 'a' })
  eq(match('/:foo+', '/a/b').params, { foo: 'a/b' })
  eq(match('/:foo+', '/a/b/c').params, { foo: 'a/b/c' })
})

test('match catch all', () => {
  eq(match('*', '/'), {})
  eq(match('*', '/a'), {})
  eq(match('*', '/a/b'), {})
  eq(match('*', '/a/b/c'), {})
})

test('match query params', () => {
  eq(match('/bar/:foo', '/bar/baz?q=s#abc'), {
    path: '/bar/baz?q=s#abc',
    pathname: '/bar/baz',
    pattern: '/bar/:foo',
    params: { foo: 'baz' },
    query: { q: 's' },
    hash: '#abc'
  })
})
