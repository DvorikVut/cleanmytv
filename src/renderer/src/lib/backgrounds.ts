// First-party background sources (issue #5). Fetching happens on this computer only;
// only prepared JPEGs (1920x1080, under 300 KB) ever reach the TV.
import { prepareWallpaper, type PreparedImage } from './image'

const BING_BASE = 'https://www.bing.com'
const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_IMG = 'https://image.tmdb.org/t/p'

export interface BingImage {
  urlbase: string
  copyright: string
  startdate: string // yyyymmdd
}

/** Picks the day's Bing image file URL at 1920x1080. */
export function bingFileUrl(img: BingImage): string {
  return `${BING_BASE}${img.urlbase}_1920x1080.jpg`
}

/** "bing-OHR.OryxCanyon_EN-US1234.jpg" style launcher-safe name from a Bing entry. */
export function bingName(img: BingImage): string {
  const last = img.urlbase.split('/').pop() ?? 'bing'
  const stem = last.replace(/[^A-Za-z0-9_.-]+/g, '-').replace(/^[.-]+|[.-]+$/g, '').slice(0, 50)
  return `bing-${stem || 'daily'}.jpg`
}

async function toPrepared(url: string, name: string): Promise<PreparedImage> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`download failed (${res.status})`)
  const blob = await res.blob()
  if (!blob.type.startsWith('image/')) throw new Error('the source did not return a picture')
  return prepareWallpaper(new File([blob], name, { type: blob.type }), name)
}

/** Fetches today's (or the newest available) Bing daily image, prepared for the TV. */
export async function fetchBingDaily(market = 'en-US'): Promise<PreparedImage> {
  const res = await fetch(`${BING_BASE}/HPImageArchive.aspx?format=js&idx=0&n=1&mkt=${market}`)
  if (!res.ok) throw new Error(`Bing daily is unavailable (${res.status})`)
  const data = (await res.json()) as { images?: BingImage[] }
  const img = data.images?.[0]
  if (!img?.urlbase) throw new Error('Bing daily returned no picture today.')
  return toPrepared(bingFileUrl(img), bingName(img))
}

export interface TmdbBackdrop {
  file_path: string
}

/** Raw TMDB list call, kept tiny: page through a list and return backdrop file paths. */
export async function tmdbBackdropPaths(listId: number, apiKey: string, maxPages = 5): Promise<string[]> {
  const out: string[] = []
  for (let page = 1; page <= maxPages; page++) {
    const res = await fetch(`${TMDB_BASE}/list/${listId}?api_key=${encodeURIComponent(apiKey)}&page=${page}`)
    if (!res.ok) {
      if (res.status === 404) throw new Error('that TMDB list does not exist.')
      throw new Error(`TMDB is unavailable (${res.status}).`)
    }
    const data = (await res.json()) as { items?: Array<{ backdrop_path?: string | null }>; total_pages?: number }
    for (const it of data.items ?? []) if (it.backdrop_path) out.push(it.backdrop_path)
    if (page >= (data.total_pages ?? 1)) break
  }
  return out
}

export function tmdbFileUrl(path: string): string {
  return `${TMDB_IMG}/original${path}`
}

export function tmdbName(path: string): string {
  return `tmdb-${path.replace(/^\/+/, '').replace(/\.[^.]*$/, '').replace(/[^A-Za-z0-9_.-]+/g, '-').slice(0, 50)}.jpg`
}

/** Fetches one TMDB backdrop (by original size), prepared for the TV. */
export async function fetchTmdbBackdrop(path: string): Promise<PreparedImage> {
  return toPrepared(tmdbFileUrl(path), tmdbName(path))
}
