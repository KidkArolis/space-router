import test from 'ava'
import { flatten } from '../src/router.js'

test('converts array of routes to array of internal route descriptors', (t) => {
  t.deepEqual(
    flatten([
      { path: '/foo', a: 'foo' },
      { path: '/bar', a: 'bar' },
    ]),
    [
      { pattern: '/foo', data: [{ a: 'foo' }] },
      { pattern: '/bar', data: [{ a: 'bar' }] },
    ]
  )
})

test('handles nested routes', (t) => {
  t.deepEqual(
    flatten([
      {
        component: 'root',
        routes: [
          {
            path: '/foo',
            component: 'foo',
            routes: [
              {
                path: '/foo/bar',
                component: 'bar',
              },
            ],
          },
        ],
      },
      {
        path: '/second',
        component: 'second-root',
        routes: [
          {
            path: '/baz/*',
            component: 'baz',
          },
        ],
      },
    ]),
    [
      { pattern: '', data: [{ component: 'root' }] },
      { pattern: '/foo', data: [{ component: 'root' }, { component: 'foo' }] },
      { pattern: '/foo/bar', data: [{ component: 'root' }, { component: 'foo' }, { component: 'bar' }] },
      { pattern: '/second', data: [{ component: 'second-root' }] },
      { pattern: '/baz/*', data: [{ component: 'second-root' }, { component: 'baz' }] },
    ]
  )
})

test('handles empty array', (t) => {
  t.deepEqual(flatten([]), [])
})
