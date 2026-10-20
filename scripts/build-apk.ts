// Builds resources/launcher.apk, the launcher the app bundles, with the same code path the app's
// "Build from source" uses: JDK 17 and the Android SDK are downloaded into .cytv-build/ if missing.
//   npm run apk                          download the pinned upstream commit (upstream.json) and build it
//   UPSTREAM_DIR=<clone> npm run apk     build a local checkout of that commit instead
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { configurePaths, paths } from '../src/main/paths'
import * as tools from '../src/main/toolchain'
import pin from '../upstream.json'

async function main(): Promise<void> {
  configurePaths(resolve('resources'), resolve('.cytv-build'))
  for (const tool of ['jdk', 'sdk'] as const) {
    const ready = tool === 'jdk' ? !!tools.javaHome() : tools.sdkReady()
    if (!ready) {
      const r = await tools.get(tool)
      if (!r.ok) throw new Error(r.summary)
    }
  }
  let source = process.env.UPSTREAM_DIR ? resolve(process.env.UPSTREAM_DIR) : tools.dirs.source
  if (!process.env.UPSTREAM_DIR && !tools.sourceReady()) {
    const r = await tools.get('source')
    if (!r.ok) throw new Error(r.summary)
    source = tools.dirs.source
  }
  const javaHome = tools.javaHome()!
  if (!existsSync(paths.keystore)) {
    // One key for every copy of the app, so the bundled APK and local builds install over each other.
    mkdirSync(join(paths.keystore, '..'), { recursive: true })
    const keytool = join(javaHome, 'bin', process.platform === 'win32' ? 'keytool.exe' : 'keytool')
    const r = await tools.run('build', keytool, ['-genkeypair', '-keystore', paths.keystore, '-storetype', 'PKCS12',
      '-storepass', tools.KEYSTORE.password, '-keypass', tools.KEYSTORE.password, '-alias', tools.KEYSTORE.alias,
      '-keyalg', 'RSA', '-keysize', '2048', '-validity', '10000', '-dname', 'CN=CleanMyTV'])
    if (r.code !== 0) throw new Error('keytool failed')
  }
  // A local checkout must be the pinned commit too, unless UPSTREAM_UNPINNED says this is a trial build.
  let sourceRev: string | undefined
  if (process.env.UPSTREAM_DIR) {
    try { sourceRev = execFileSync('git', ['-C', source, 'rev-parse', 'HEAD']).toString().trim() } catch { sourceRev = undefined }
    if (sourceRev !== pin.commit) {
      const msg = `UPSTREAM_DIR is at ${sourceRev ?? 'an unknown commit'}, not the pinned ${pin.commit} (upstream.json)`
      if (!process.env.UPSTREAM_UNPINNED) throw new Error(msg)
      console.warn('warning: ' + msg)
    }
  }
  const version = await tools.buildApk({ sourceDir: source, sdkDir: tools.dirs.sdk, javaHome, keystore: paths.keystore, outFile: paths.bundledApk, gradleHome: tools.dirs.gradleHome, sourceRev })
  console.log(`built launcher ${version} -> ${paths.bundledApk}`)
}

main().catch((e) => {
  console.error(e.message)
  process.exit(1)
})
