const eq = require('assert').deepStrictEqual
const flatten = require('../src/flatten')

suite('flatten')

test('converts array of routes to array of internap route descriptors', () => {
  eq(
    flatten([
      {
        path: '/foo',
        name: 'foo'
      },
      {
        path: '/bar',
        name: 'bar'
      }
    ]),
    [
      {
        pattern: '/foo',
        data: [{ name: 'foo' }]
      },
      {
        pattern: '/bar',
        data: [{ name: 'bar' }]
      }
    ]
  )
})

test('handles nested routes', () => {
  eq(
    flatten([
      {
        name: 'superoot',
        routes: [
          {
            name: 'root',
            routes: [
              {
                path: '/foo',
                name: 'foo',
                routes: [
                  {
                    path: '/foo/bar',
                    name: 'bar'
                  }
                ]
              }
            ]
          },
          {
            path: '/second',
            name: 'second-root',
            routes: [{ path: '/baz/*', name: 'baz' }]
          }
        ]
      }
    ]),
    [
      { pattern: '/foo', data: [{ name: 'superoot' }, { name: 'root' }, { name: 'foo' }] },
      { pattern: '/foo/bar', data: [{ name: 'superoot' }, { name: 'root' }, { name: 'foo' }, { name: 'bar' }] },
      { pattern: '/second', data: [{ name: 'superoot' }, { name: 'second-root' }] },
      { pattern: '/baz/*', data: [{ name: 'superoot' }, { name: 'second-root' }, { name: 'baz' }] }
    ]
  )
})

test('handles empty array', () => {
  eq(flatten([]), [])
})
