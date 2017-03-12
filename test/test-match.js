const { eq, assert } = require('@briancavalier/assert')
const match = require('../src/match')

suite('match')

test('match explicit equality', () => {
  eq(match('/', '/'), {})
  eq(match('/a', '/a'), {})
  eq(match('/a', '/b'), false)
  eq(match('/a/b', '/a/b'), {})
  eq(match('/a/b', '/a/a'), false)
  eq(match('/a/b', '/b/b'), false)
})

test('match param segments', () => {
  eq(match('/', '/:foo'), false)
  eq(match('/bar', '/:foo'), { foo: 'bar' })
  eq(match('/bar/baz', '/bar/:foo'), { foo: 'baz' })
})

test('match optional param segments', () => {
  eq(match('/', '/:foo?'), { foo: '' })
  eq(match('/bar', '/:foo?'), { foo: 'bar' })
  eq(match('/', '/:foo?/:bar?'), { foo: '', bar: '' })
  eq(match('/bar', '/:foo?/:bar?'), { foo: 'bar', bar: '' })
  eq(match('/bar', '/:foo?/bar'), false)
  eq(match('/foo/bar', '/:foo?/bar'), { foo: 'foo' })
})

test('match splat param segments', () => {
  eq(match('/', '/:foo*'), { foo: '' })
  eq(match('/a', '/:foo*'), { foo: 'a' })
  eq(match('/a/b', '/:foo*'), { foo: 'a/b' })
  eq(match('/a/b/c', '/:foo*'), { foo: 'a/b/c' })
})

test('match required splat param segments', () => {
  eq(match('/', '/:foo+'), false)
  eq(match('/a', '/:foo+'), { foo: 'a' })
  eq(match('/a/b', '/:foo+'), { foo: 'a/b' })
  eq(match('/a/b/c', '/:foo+'), { foo: 'a/b/c' })
})
