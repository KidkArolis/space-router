const eq = require('assert').deepStrictEqual
const flatten = require('../src/flatten')

suite('flatten')

test('converts array of routes to array of internap route descriptors', () => {
  eq(flatten([['/foo', 'foo'], ['/bar', 'bar']]), [
    { pattern: '/foo', data: ['foo'] },
    { pattern: '/bar', data: ['bar'] }
  ])
})

test('handles nested routes', () => {
  eq(
    flatten([['', 'root', [['/foo', 'foo', [['/foo/bar', 'bar']]]]], ['/second', 'second-root', [['/baz/*', 'baz']]]]),
    [
      { pattern: '', data: ['root'] },
      { pattern: '/foo', data: ['root', 'foo'] },
      { pattern: '/foo/bar', data: ['root', 'foo', 'bar'] },
      { pattern: '/second', data: ['second-root'] },
      { pattern: '/baz/*', data: ['second-root', 'baz'] }
    ]
  )
})

test('handles empty array', () => {
  eq(flatten([]), [])
})
