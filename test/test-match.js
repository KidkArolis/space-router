const eq = require('assert').deepEqual
const qs = require('../src/qs')
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
  eq(match('*', '/some/thing?abc=1', qs), {
    href: '/some/thing?abc=1',
    pathname: '/some/thing',
    pattern: '*',
    params: {},
    query: {
      abc: '1'
    },
    hash: ''
  })
  eq(!!match('*', '/a', qs), true)
  eq(!!match('*', '/a/b', qs), true)
  eq(!!match('*', '/a/b/c', qs), true)
})

test('match query params', () => {
  eq(match('/bar/:foo', '/bar/baz?q=s#abc', qs), {
    href: '/bar/baz?q=s#abc',
    pathname: '/bar/baz',
    pattern: '/bar/:foo',
    params: { foo: 'baz' },
    query: { q: 's' },
    hash: '#abc'
  })
})
