import test from 'ava'
import { flatten } from '../src/router.ts'

test('converts array of routes to array of internal route descriptors', (t) => {
  t.deepEqual(
    flatten([
      { path: '/foo', a: 'foo' },
      { path: '/bar', a: 'bar' },
    ]),
    [
      { pattern: '/foo', data: [{ path: '/foo', a: 'foo' }] },
      { pattern: '/bar', data: [{ path: '/bar', a: 'bar' }] },
    ],
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
      // the pathless root route produces no matchable entry of its own,
      // it only contributes data to its children
      {
        pattern: '/foo',
        data: [
          { path: '', component: 'root' },
          { path: '/foo', component: 'foo' },
        ],
      },
      {
        pattern: '/foo/bar',
        data: [
          { path: '', component: 'root' },
          { path: '/foo', component: 'foo' },
          { path: '/foo/bar', component: 'bar' },
        ],
      },
      { pattern: '/second', data: [{ path: '/second', component: 'second-root' }] },
      {
        pattern: '/baz/*',
        data: [
          { path: '/second', component: 'second-root' },
          { path: '/baz/*', component: 'baz' },
        ],
      },
    ],
  )
})

test('handles empty array', (t) => {
  t.deepEqual(flatten([]), [])
})
