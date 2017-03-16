if (module.hot) {
  module.hot.accept()
  module.hot.dispose(() => {
    router.stop()
  })
}

const Preact = require('preact')
const createRouter = require('../..')

const App = ({ router, children }) =>
  <div className='App'>
    <div className='Nav'>
      <a href='/'>Home</a>
      <a href='/channels'>Channels</a>
      <a href='/channels/5'>Channel 5</a>
    </div>
    <div className='Content'>
      {children}
    </div>
    <style>{`
      body, html { padding: 20px; font-family: sans-serif; }
      a { padding: 10px; }
      .Nav { padding: 10px 0; border-bottom: 1px solid #eee; }
      .Content { padding: 20px 10px; }
    `}
    </style>
  </div>

const Home = (props) => <div>Home</div>
const Channels = (props) => <div>Channels</div>
const Channel = (props) => <div>Channel {props.params.id}</div>
const NotFound = (props) => <div>404</div>

const router = createRouter([
  ['', App, [
    ['/', Home],
    ['/channels', Channels],
    ['/channels/:id', Channel],
    ['*', NotFound]
  ]]
]).start(render)

function render (route, components) {
  let app = components.reduceRight((children, Component) =>
    <Component params={route.params}>{children}</Component>
  , null)
  Preact.render(app, document.body, document.body.lastElementChild)
}
