const fs = require('fs')
const path = require('path')

;(async function () {
  const { execa } = await import('execa')
  const sh = (...args) => execa(...args, { stdio: 'inherit', shell: true })

  await sh('rm -rf dist')
  await sh('mkdir -p dist')

  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json')))

  const swc = './node_modules/.bin/swc'
  await sh(`${swc} --no-swcrc src -d ${pkg.main} --config-file=./.swc-cjs`)
  await sh(`${swc} --no-swcrc src -d ${pkg.module} --config-file=./.swc-esm`)
})()
