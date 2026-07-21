import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

async function run() {
  const packagePath = join(process.cwd(), './package.json')
  const packageData = await readFile(packagePath, 'utf8')
  const { version, name } = JSON.parse(packageData)
  const src = `export const name = '${name}'\nexport const version = '${version}'\n`
  await writeFile(join(process.cwd(), 'src/config/version.ts'), src, 'utf8')
}

await run()
