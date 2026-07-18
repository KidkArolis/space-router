import test from 'ava'
import { qs } from '../src/index.ts'
import { matchOne as match } from '../src/match.ts'

test('match explicit equality', (t) => {
  t.deepEqual(match('/', '/')?.params, {})
  t.deepEqual(match('/a', '/a')?.params, {})
  t.deepEqual(match('/a', '/b'), undefined)
  t.deepEqual(match('/a/b', '/a/b')?.params, {})
  t.deepEqual(match('/a/b', '/a/a'), undefined)
  t.deepEqual(match('/a/b', '/b/b'), undefined)
})

test('match param segments', (t) => {
  t.deepEqual(match('/:foo', '/'), undefined)
  t.deepEqual(match('/:foo', '/bar')?.params, { foo: 'bar' })
  t.deepEqual(match('/bar/:foo', '/bar/baz')?.params, { foo: 'baz' })
})

test('match optional param segments', (t) => {
  t.deepEqual(match('/:foo?', '/')?.params, { foo: '' })
  t.deepEqual(match('/:foo?', '/bar')?.params, { foo: 'bar' })
  t.deepEqual(match('/:foo?/:bar?', '/')?.params, { foo: '', bar: '' })
  t.deepEqual(match('/:foo?/:bar?', '/bar')?.params, { foo: 'bar', bar: '' })
  t.deepEqual(match('/:foo?/bar', '/bar'), undefined)
  t.deepEqual(match('/:foo?/bar', '/foo/bar')?.params, { foo: 'foo' })
})

test('match splat param segments', (t) => {
  t.deepEqual(match('/:foo*', '/')?.params, { foo: '' })
  t.deepEqual(match('/:foo*', '/a')?.params, { foo: 'a' })
  t.deepEqual(match('/:foo*', '/a/b')?.params, { foo: 'a/b' })
  t.deepEqual(match('/:foo*', '/a/b/c')?.params, { foo: 'a/b/c' })
})

test('match required splat param segments', (t) => {
  t.deepEqual(match('/:foo+', '/'), undefined)
  t.deepEqual(match('/:foo+', '/a')?.params, { foo: 'a' })
  t.deepEqual(match('/:foo+', '/a/b')?.params, { foo: 'a/b' })
  t.deepEqual(match('/:foo+', '/a/b/c')?.params, { foo: 'a/b/c' })
})

test('match catch all', (t) => {
  t.deepEqual(match('*', '/some/thing?abc=1', qs), {
    url: '/some/thing?abc=1',
    pathname: '/some/thing',
    pattern: '*',
    params: {},
    query: { abc: '1' },
    search: '?abc=1',
    hash: '',
  })
  t.deepEqual(!!match('*', '/a', qs), true)
  t.deepEqual(!!match('*', '/a/b', qs), true)
  t.deepEqual(!!match('*', '/a/b/c', qs), true)
})

test('malformed percent-encoding falls back to the raw segment instead of throwing', (t) => {
  t.deepEqual(match('/:foo', '/%zz')?.params, { foo: '%zz' })
  t.deepEqual(match('/:foo+', '/a/%zz')?.params, { foo: 'a/%zz' })
  t.deepEqual(match('/user/:id', '/user/ok%20name')?.params, { id: 'ok name' })
})

test('match query params', (t) => {
  t.deepEqual(match('/bar/:foo', '/bar/baz?q=s#abc', qs), {
    url: '/bar/baz?q=s#abc',
    pathname: '/bar/baz',
    pattern: '/bar/:foo',
    params: { foo: 'baz' },
    query: { q: 's' },
    search: '?q=s',
    hash: '#abc',
  })
})
