const createRouter = require('../..')

const router = createRouter(
  ['', () => 'app', [
    ['/', () => 'index'],
    ['/channels', () => 'channels', [
      ['/channels/:id', (params) => 'channel ' + params.id]
    ]],
    ['/video/:id', (params) => 'video ' + params.id],
    ['*', () => 'not found']
  ]]
).start(onTransition)

function onTransition (route, data) {
  let { params } = route
  // just logging instead of rendering to keep the example simple
  console.log('Matched', '[' + data.map(fn => fn(params)).join(', ') + ']')
}

router.push('/channels')
// -> Matched [all, channels]
router.push('/channels/5')
// -> Matched [all, channels, channel 5]
router.push('/channels/6', { replace: true })
// -> Matched [all, channels, channel 6], replaces current url, back button goes to /channels
router.push('/video/5', { query: { t: '30s' } })
// -> Matched [all, channels, video 5], adds a query string to the url /video/5?t=30s

router.current()
// -> returns { pattern, params, path, pathname, query, hash, data }

router.data('/channels/:id')
// -> [() => 'all', (params) => 'channel ' + params.id]
router.data({ pattern: '/channels/:id' })
// -> [() => 'all', (params) => 'channel ' + params.id]

router.href('/video/5', { query: { t: '25s' } })
// -> '/video/5?t=25s' in history mode or /#/video/5?t=25s in hash mode
