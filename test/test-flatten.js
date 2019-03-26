const eq = require('assert').deepStrictEqual
const flatten = require('../src/flatten')

suite('flatten')

test('converts array of routes to an array of internal route descriptors', () => {
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
        re: {
          keys: [],
          pattern: /^\/foo\/?$/i
        },
        data: [{ name: 'foo' }]
      },
      {
        pattern: '/bar',
        re: {
          keys: [],
          pattern: /^\/bar\/?$/i
        },
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
      {
        pattern: '/foo',
        re: {
          keys: [],
          pattern: /^\/foo\/?$/i
        },
        data: [{ name: 'superoot' }, { name: 'root' }, { name: 'foo' }]
      },
      {
        pattern: '/foo/bar',
        re: {
          keys: [],
          pattern: /^\/foo\/bar\/?$/i
        },
        data: [{ name: 'superoot' }, { name: 'root' }, { name: 'foo' }, { name: 'bar' }]
      },
      {
        pattern: '/second',
        re: {
          keys: [],
          pattern: /^\/second\/?$/i
        },
        data: [{ name: 'superoot' }, { name: 'second-root' }]
      },
      {
        pattern: '/baz/*',
        re: {
          keys: ['wild'],
          pattern: /^\/baz\/(.*)\/?$/i
        },
        data: [{ name: 'superoot' }, { name: 'second-root' }, { name: 'baz' }]
      }
    ]
  )
})

test('handles empty array', () => {
  eq(flatten([]), [])
})
