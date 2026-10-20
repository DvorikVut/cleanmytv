// TV settings outside the launcher, all from upstream README: the Clock screensaver, ad-blocking
// Private DNS, animation speed and the launcher's own language.
import { Socket } from 'node:net'
import * as T from './tv'
import { PKG } from './launcher'
import type { ApplyResult, SystemState } from '@shared/api'

const TASK = 'system'
const CLOCK = `${PKG}/.ClockDream`

export async function state(): Promise<SystemState> {
  const get = async (ns: string, key: string): Promise<string> => (await T.tv().shell(`settings get ${ns} ${key}`)).trim()
  return {
    sdk: T.getStatus().probe?.sdk ?? 0,
    screensaverIsClock: (await get('secure', 'screensaver_components')).includes(CLOCK),
    privateDnsMode: await get('global', 'private_dns_mode'),
    privateDnsHost: await get('global', 'private_dns_specifier'),
    animationScale: await get('global', 'window_animation_scale')
  }
}

export async function clockScreensaver(on: boolean): Promise<ApplyResult> {
  if (on) {
    await T.sh(TASK, `settings put secure screensaver_components ${CLOCK}; settings put secure screensaver_enabled 1`)
    return { ok: true, summary: 'The Clock screensaver is on.', warnings: [] }
  }
  // Back to the TV's own choice: an empty value makes Android use its default dream.
  await T.sh(TASK, 'settings delete secure screensaver_components')
  return { ok: true, summary: "The TV's own screensaver is back.", warnings: [] }
}

export async function privateDns(host: string | null): Promise<ApplyResult> {
  if (!host) {
    await T.sh(TASK, 'settings put global private_dns_mode opportunistic')
    return { ok: true, summary: 'Private DNS is back to automatic.', warnings: [] }
  }
  T.q(host)
  if (!/^[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(host)) throw new Error(`not a DNS host name: ${host}`)
  if ((T.getStatus().probe?.sdk ?? 0) < 28) throw new Error('Private DNS needs Android 9 or newer.')
  await T.sh(TASK, `settings put global private_dns_specifier ${host}`)
  await T.sh(TASK, 'settings put global private_dns_mode hostname')
  return {
    ok: true,
    summary: `Every app's DNS now goes to ${host}.`,
    warnings: ['If an app stops playing or the TV says "No internet", switch Private DNS off here.']
  }
}

export async function animationScale(scale: number): Promise<ApplyResult> {
  if (![0, 0.5, 1].includes(scale)) throw new Error('scale must be 0, 0.5 or 1')
  for (const k of ['window_animation_scale', 'transition_animation_scale', 'animator_duration_scale']) {
    await T.sh(TASK, `settings put global ${k} ${scale}`)
  }
  return { ok: true, summary: scale === 0 ? 'System animations are off.' : `System animations run at ${scale}x.`, warnings: [] }
}

export async function launcherLocale(tag: string): Promise<ApplyResult> {
  if (tag && !/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(tag)) throw new Error(`not a language tag: ${tag}`)
  if ((T.getStatus().probe?.sdk ?? 0) < 33) throw new Error('A per-app language needs Android 13 or newer; the launcher follows the TV language.')
  await T.sh(TASK, `cmd locale set-app-locales ${PKG} --locales ${tag || '""'}`)
  await T.sh(TASK, `am force-stop ${PKG}; am start -n ${PKG}/.MainActivity >/dev/null`)
  return { ok: true, summary: tag ? `The launcher now shows ${tag}.` : 'The launcher follows the TV language again.', warnings: [] }
}

export async function key(code: number): Promise<void> {
  if (!Number.isInteger(code) || code < 0 || code > 400) throw new Error('bad keycode')
  await T.tv().shell(`input keyevent ${code}`)
}

export async function reboot(): Promise<void> {
  await T.tv().shell('reboot').catch(() => undefined)
}

/** Upstream tools/adb-closed.py: refused or silent means closed. */
export function adbClosed(host: string): Promise<{ closed: boolean; message: string }> {
  return new Promise((resolve) => {
    const s = new Socket()
    const done = (closed: boolean, message: string): void => { s.destroy(); resolve({ closed, message }) }
    s.setTimeout(3000)
    s.once('connect', () => done(false, `${host}:5555 is still open: network debugging is on. On the TV, switch USB debugging and Network/ADB debugging off, reboot, and check again.`))
    s.once('timeout', () => done(true, `${host}:5555 did not answer in 3 s: closed, unless the TV is off or at another address.`))
    s.once('error', (e: NodeJS.ErrnoException) => {
      if (e.code === 'ECONNREFUSED') done(true, `${host}:5555 is closed: the TV refused the connection.`)
      else done(false, `Could not check ${host}:5555 (${e.code ?? e.message}). Is the TV on and on this network?`)
    })
    s.connect(5555, host)
  })
}
