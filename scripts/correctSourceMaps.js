import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const replaceInFile = async (filePath) => {
  let content = await readFile(filePath, 'utf8')
  content = content.replace('../src/', '')
  await writeFile(filePath, content, 'utf8')
}

export const correctSourceMapsPaths = async (dir) => {
  const files = await readdir(dir)
  for (const file of files) {
    const fullPath = join(dir, file)
    const info = await stat(fullPath)
    if (info.isDirectory()) {
      await correctSourceMapsPaths(fullPath)
    } else if (fullPath.endsWith('.map')) {
      await replaceInFile(fullPath)
    }
  }
}
