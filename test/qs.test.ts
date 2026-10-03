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

test('qs.parse tolerates malformed percent-encoding using native decoding', (t) => {
  t.deepEqual(qs.parse('a=%zz'), { a: '%zz' })
  t.deepEqual(qs.parse('%zz=1'), { '%zz': '1' })
  t.deepEqual(qs.parse('a=%E0%A4%A'), { a: '\uFFFD%A' })
})

test('qs.parse accepts a leading ? and keeps the last duplicate value', (t) => {
  t.deepEqual(qs.parse('?a=1&a=2'), { a: '2' })
  t.deepEqual(qs.parse(''), {})
})

test('qs.parse preserves prototype-named keys as own properties', (t) => {
  const query = qs.parse('__proto__=value&constructor=ctor&toString=text')
  t.deepEqual(Object.keys(query), ['__proto__', 'constructor', 'toString'])
  t.is(query['__proto__'], 'value')
  t.is(query['constructor'], 'ctor')
  t.is(query['toString'], 'text')
  t.is(Object.getPrototypeOf(query), Object.prototype)
})

test('qs.stringify encodes the key', (t) => {
  t.is(qs.stringify({ 'foo bar': 1 }), 'foo+bar=1')
})

test('qs.stringify skips undefined and roundtrips with parse', (t) => {
  t.is(qs.stringify({ a: 'x y', b: undefined, c: 'a/b' }), 'a=x+y&c=a%2Fb')
  t.deepEqual(qs.parse(qs.stringify({ a: 'x y', c: 'a/b' })), { a: 'x y', c: 'a/b' })
})

test('qs.stringify uses form encoding and stringifies defined values', (t) => {
  t.is(
    qs.stringify({ q: "~!*'()+", empty: '', nil: null, flag: false, n: 0 }),
    'q=%7E%21*%27%28%29%2B&empty=&nil=null&flag=false&n=0',
  )
  t.is(qs.stringify({}), '')
  t.is(qs.stringify({ omitted: undefined }), '')
})

test('qs.stringify replaces lone surrogates instead of throwing', (t) => {
  t.is(qs.stringify({ q: '\uD800' }), 'q=%EF%BF%BD')
})
