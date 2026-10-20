import type { LauncherConfig, TvApp } from '@shared/api'

/** The launcher's built-in values from upstream launcher/app/src/main/res/values/config.xml. */
export const BUILTIN: Required<Pick<LauncherConfig,
  'dock_apps' | 'hidden_apps' | 'columns' | 'rows_below_dock' | 'fill_dock' | 'dock_title' | 'dock_row' | 'reorder_button' |
  'app_library' | 'shamsi_date' | 'module_cards' | 'reduced_motion' | 'animations' | 'advanced_effects' | 'show_stats' |
  'sky_intensity' | 'background_color' | 'wallpaper' | 'wallpaper_dim' | 'wallpaper_rotation_minutes' | 'settings_key_panel' |
  'greeting_name' | 'live_tv_package' | 'vpn_app' | 'show_home_settings_shortcut'>> = {
  dock_apps: ['com.netflix.ninja', 'com.amazon.amazonvideo.livingroom', 'com.google.android.youtube.tv', 'in.startv.hotstar'],
  hidden_apps: ['com.mediatek.wwtv.tvcenter', 'com.mitv.gallery'],
  columns: 4,
  rows_below_dock: 0,
  fill_dock: true,
  dock_title: true,
  dock_row: true,
  reorder_button: false,
  app_library: false,
  shamsi_date: false,
  module_cards: true,
  reduced_motion: false,
  animations: true,
  advanced_effects: false,
  show_stats: false,
  sky_intensity: 0,
  background_color: '#000000',
  wallpaper: true,
  wallpaper_dim: 0,
  wallpaper_rotation_minutes: 0,
  settings_key_panel: false,
  greeting_name: '',
  live_tv_package: 'com.mediatek.wwtv.tvcenter',
  vpn_app: '',
  show_home_settings_shortcut: false
}

export function val<K extends keyof typeof BUILTIN>(cfg: LauncherConfig, key: K): (typeof BUILTIN)[K] {
  const v = cfg[key]
  return (v === undefined ? BUILTIN[key] : v) as (typeof BUILTIN)[K]
}

const KNOWN_COLOURS: Record<string, string> = {
  'com.netflix.ninja': '#b20710',
  'com.google.android.youtube.tv': '#c4302b',
  'com.google.android.youtube.tvmusic': '#a5221c',
  'com.amazon.amazonvideo.livingroom': '#1a98ff',
  'com.disney.disneyplus': '#113ccf',
  'com.spotify.tv.android': '#1db954',
  'com.plexapp.android': '#cc7b19',
  'com.apple.atve.androidtv.appletv': '#333333',
  'tv.twitch.android.app': '#7a3fd8',
  'org.videolan.vlc': '#e85e00',
  'com.hbo.hbonow': '#2b2bd9',
  'in.startv.hotstar': '#0f1a5c'
}

export function appColour(pkg: string): string {
  if (KNOWN_COLOURS[pkg]) return KNOWN_COLOURS[pkg]
  let h = 0
  for (const c of pkg) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return `hsl(${h % 360} 45% 34%)`
}

export function monogram(label: string): string {
  const words = label.replace(/[^\p{L}\p{N} ]/gu, ' ').split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0][0].toUpperCase()
  return (words[0][0] + words[1][0]).toUpperCase()
}

/**
 * The tile order the launcher would show (AppAdapter.java): dock_apps order first, then alphabetical.
 * Only TV apps appear on Home unless the App library adds others.
 */
export function orderedApps(apps: TvApp[], cfg: LauncherConfig): TvApp[] {
  const dock = val(cfg, 'dock_apps')
  return apps
    .filter((a) => a.tv)
    .sort((a, b) => {
      const fa = dock.indexOf(a.pkg)
      const fb = dock.indexOf(b.pkg)
      if (fa >= 0 || fb >= 0) {
        if (fa < 0) return 1
        if (fb < 0) return -1
        return fa - fb
      }
      return a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
    })
}

export interface HomeLayout {
  dock: (TvApp | null)[]
  grid: TvApp[]
}

/** What lands in the dock and the grid, with empty dock slots when fill_dock is off. */
export function homeLayout(apps: TvApp[], cfg: LauncherConfig): HomeLayout {
  const hidden = new Set(val(cfg, 'hidden_apps'))
  const dockApps = val(cfg, 'dock_apps')
  const cols = val(cfg, 'columns')
  const visible = orderedApps(apps, cfg).filter((a) => !hidden.has(a.pkg))
  let docked = 0
  while (docked < visible.length && dockApps.includes(visible[docked].pkg)) docked++
  const fill = val(cfg, 'fill_dock')
  if (!fill && docked > 0 && docked < cols && visible.length > docked) {
    const dock: (TvApp | null)[] = visible.slice(0, docked)
    while (dock.length < cols) dock.push(null)
    return { dock, grid: visible.slice(docked) }
  }
  return { dock: visible.slice(0, cols), grid: visible.slice(cols) }
}
