import { describe, expect, it } from 'vitest'
import { bingFileUrl, bingName, tmdbFileUrl, tmdbName } from '../src/renderer/src/lib/backgrounds'

describe('bing daily source', () => {
  it('builds the 1920x1080 file url from a urlbase', () => {
    expect(bingFileUrl({ urlbase: '/th?id=OHR.OryxCanyon_EN-US1234', copyright: '', startdate: '20261025' })).toBe(
      'https://www.bing.com/th?id=OHR.OryxCanyon_EN-US1234_1920x1080.jpg'
    )
  })

  it('derives a launcher-safe name from the urlbase', () => {
    const name = bingName({ urlbase: '/th?id=OHR.Some_Place Name.EN-US9999', copyright: '', startdate: '' })
    expect(name).toMatch(/^bing-[A-Za-z0-9_.-]+\.jpg$/)
  })
})

describe('tmdb source', () => {
  it('builds original-size file urls', () => {
    expect(tmdbFileUrl('/abc123.jpg')).toBe('https://image.tmdb.org/t/p/original/abc123.jpg')
  })

  it('sanitises backdrop paths into launcher-safe names', () => {
    expect(tmdbName('/xY4z9QpQzWvB2N8mK1sLcD.jpg')).toBe('tmdb-xY4z9QpQzWvB2N8mK1sLcD.jpg')
    expect(tmdbName('/weird name+here.jpg')).toMatch(/^tmdb-[A-Za-z0-9_.-]+\.jpg$/)
    expect(tmdbName('/weird name+here.jpg')).not.toContain(' ')
  })
})
