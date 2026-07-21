import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pkg from 'fs-extra'

const { moveSync, pathExistsSync, removeSync } = pkg
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packageJsonPath = path.join(__dirname, '../package.json')
const tmpPath = `${packageJsonPath}.tmp`

if (pathExistsSync(tmpPath)) {
  removeSync(packageJsonPath)
  moveSync(tmpPath, packageJsonPath)
  console.log('Restored package.json from package.json.tmp')
}
