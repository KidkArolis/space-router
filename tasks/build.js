import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { execa } from 'execa'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sh = (...args) => execa(...args, { stdio: 'inherit', shell: true })

;(async function () {
  await sh('rm -rf dist')
  await sh('mkdir -p dist')

  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json')))

  const swc = './node_modules/.bin/swc'
  await sh(`${swc} --no-swcrc src -d ${pkg.main} --config-file=./.swc-cjs`)
  await sh(`${swc} --no-swcrc src -d ${pkg.module} --config-file=./.swc-esm`)
})()
