const execa = require('execa')

const sh = (...args) => execa(...args, { stdio: 'inherit', shell: true })

;(async function () {
  await sh('rm -rf dist')
  await sh('mkdir -p dist')

  const pkg = require('../package.json')

  const babel = './node_modules/.bin/babel'
  await sh(`${babel} --no-babelrc src -d ${pkg.main} --config-file=./.babelrc-cjs`)
  await sh(`${babel} --no-babelrc src -d ${pkg.module} --config-file=./.babelrc-esm`)
})()
