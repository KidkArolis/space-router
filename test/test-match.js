const eq = require('assert').deepStrictEqual
const qs = require('../src/qs')
const flatten = require('../src/flatten')
const matcher = require('../src/match')

const match = (pattern, url, qs) => matcher(flatten([{ path: pattern }]), url, qs)

suite('match')

test('match explicit equality', () => {
  eq(match('/', '/').params, {})
  eq(match('/a', '/a').params, {})
  eq(match('/a', '/b'), undefined)
  eq(match('/a/b', '/a/b').params, {})
  eq(match('/a/b', '/a/a'), undefined)
  eq(match('/a/b', '/b/b'), undefined)
})

test('match param segments', () => {
  eq(match('/:foo', '/'), undefined)
  eq(match('/:foo', '/bar').params, { foo: 'bar' })
  eq(match('/bar/:foo', '/bar/baz').params, { foo: 'baz' })
})

test('match optional param segments', () => {
  eq(match('/:foo?', '/').params, { foo: null })
  eq(match('/:foo?', '/bar').params, { foo: 'bar' })
  eq(match('/:foo?/:bar?', '/').params, { foo: null, bar: null })
  eq(match('/:foo?/:bar?', '/bar').params, { foo: 'bar', bar: null })
  eq(match('/:foo?/bar', '/bar').params, { foo: null })
  eq(match('/:foo?/bar', '/foo/bar').params, { foo: 'foo' })
})

test('match splat param segments', () => {
  eq(match('/*', '/').params, { wild: null })
  eq(match('/*', '/a').params, { wild: 'a' })
  eq(match('/*', '/a/b').params, { wild: 'a/b' })
  eq(match('/*', '/a/b/c').params, { wild: 'a/b/c' })
})

test('match catch all', () => {
  eq(match('*', '/some/thing?abc=1', qs), {
    href: '/some/thing?abc=1',
    pathname: '/some/thing',
    pattern: '*',
    params: {
      wild: 'some/thing'
    },
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
