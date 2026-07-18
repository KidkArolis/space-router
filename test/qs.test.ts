import test from 'ava'
import { qs } from '../src/index.ts'

test('qs.parse handles a key without =', (t) => {
  t.deepEqual(qs.parse('foo'), { foo: '' })
})

test('qs.parse keeps everything after the first = in the value', (t) => {
  t.deepEqual(qs.parse('a=b=c'), { a: 'b=c' })
})

test('qs.parse decodes the key', (t) => {
  t.deepEqual(qs.parse('foo%20bar=1'), { 'foo bar': '1' })
})

test('qs.parse decodes + as space (form-urlencoded)', (t) => {
  t.deepEqual(qs.parse('q=hello+world'), { q: 'hello world' })
})

test('qs.parse handles empty pairs', (t) => {
  t.deepEqual(qs.parse('a=1&&b=2'), { a: '1', b: '2' })
})

test('qs.parse falls back to raw values on malformed percent-encoding instead of throwing', (t) => {
  t.deepEqual(qs.parse('a=%zz'), { a: '%zz' })
  t.deepEqual(qs.parse('%zz=1'), { '%zz': '1' })
})

test('qs.stringify encodes the key', (t) => {
  t.is(qs.stringify({ 'foo bar': 1 }), 'foo%20bar=1')
})

test('qs.stringify skips undefined and roundtrips with parse', (t) => {
  t.is(qs.stringify({ a: 'x y', b: undefined, c: 'a/b' }), 'a=x%20y&c=a%2Fb')
  t.deepEqual(qs.parse(qs.stringify({ a: 'x y', c: 'a/b' })), { a: 'x y', c: 'a/b' })
})
