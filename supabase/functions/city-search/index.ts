// Proxy alla freeastroapi V2 city autocomplete:
//   GET https://api.freeastroapi.com/api/v2/geo/search?q=...&country=...&limit=...
// Nasconde ASTROLOGY_API_KEY al client. Ritorna nomi citta + lat/lng + IANA timezone.

import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limit.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const API_KEY = Deno.env.get('ASTROLOGY_API_KEY')!
const BASE_URL = 'https://api.freeastroapi.com/api/v2/geo/search'

// freeastroapi V2 indicizza le citta italiane con gli esonimi inglesi (Rome, Milan, ...).
// Per garantire che chi digita l'endonimo italiano trovi comunque la citta IT, manteniamo
// una mappa endonimo -> esonimo: se la query e' prefisso di un endonimo noto, lanciamo
// in parallelo una seconda fetch upstream con l'esonimo e uniamo i risultati.
const IT_ENDONYM_TO_EXONYM: Record<string, string> = {
  roma: 'Rome',
  milano: 'Milan',
  firenze: 'Florence',
  napoli: 'Naples',
  torino: 'Turin',
  venezia: 'Venice',
  genova: 'Genoa',
  padova: 'Padua',
  mantova: 'Mantua',
  siracusa: 'Syracuse',
  livorno: 'Leghorn',
  trento: 'Trent',
}

// Inverso della mappa sopra, per localizzare i nomi nelle risposte upstream.
const IT_CITY_IT: Record<string, string> = Object.fromEntries(
  Object.entries(IT_ENDONYM_TO_EXONYM).map(([endo, exo]) => [exo.toLowerCase(), endo.charAt(0).toUpperCase() + endo.slice(1)])
)

// Tuple precompute (modulo-load), per evitare Object.entries ad ogni request.
type EndonymTuple = readonly [endoLower: string, exoLower: string, exoOriginal: string]
const ENDONYM_TUPLES: EndonymTuple[] = Object.entries(IT_ENDONYM_TO_EXONYM).map(
  ([endo, exo]) => [endo.toLowerCase(), exo.toLowerCase(), exo] as const,
)

// Ritorna l'esonimo da fetchare in aggiunta SOLO se la query e' prefisso dell'endonimo
// MA NON dell'esonimo. Cosi' su "ro"/"rom" (gia' prefisso di "rome") evitiamo la seconda fetch.
const aliasNeedingSecondFetch = (qLower: string): string | null => {
  for (const [endoLower, exoLower, exoOriginal] of ENDONYM_TUPLES) {
    if (endoLower.startsWith(qLower) && !exoLower.startsWith(qLower)) return exoOriginal
  }
  return null
}

// Cache in-memory con TTL: gli isolate Supabase Edge restano caldi per minuti, quindi
// query popolari (Roma, Milano) vengono servite senza toccare upstream.
const CACHE_TTL_MS = 5 * 60 * 1000
const CACHE_MAX_ENTRIES = 500
const responseCache = new Map<string, { ts: number; payload: { results: any[]; count: number } }>()

const cacheGet = (key: string) => {
  const entry = responseCache.get(key)
  if (!entry) return null
  if (Date.now() - entry.ts > CACHE_TTL_MS) {
    responseCache.delete(key)
    return null
  }
  return entry.payload
}

const cacheSet = (key: string, payload: { results: any[]; count: number }) => {
  if (responseCache.size >= CACHE_MAX_ENTRIES) {
    const oldestKey = responseCache.keys().next().value
    if (oldestKey) responseCache.delete(oldestKey)
  }
  responseCache.set(key, { ts: Date.now(), payload })
}

const IT_REGION_IT: Record<string, string> = {
  lombardy: 'Lombardia',
  tuscany: 'Toscana',
  sicily: 'Sicilia',
  sardinia: 'Sardegna',
  apulia: 'Puglia',
  piedmont: 'Piemonte',
  latium: 'Lazio',
  'aosta valley': "Valle d'Aosta",
  'the marches': 'Marche',
  'south tyrol': 'Trentino-Alto Adige',
}

const localizeIt = (val: string | null | undefined, map: Record<string, string>): string | null => {
  if (!val) return val ?? null
  const key = val.trim().toLowerCase()
  return map[key] ?? val
}

// Quando il client non passa un country esplicito, scegliamo il paese da
// privilegiare nel sort in base alla lingua: it -> IT (default storico),
// es -> ES, en -> US. Cosi' una ricerca inglese fa salire le citta' US in cima.
// Le citta' US hanno gia' i nomi in inglese (New York, Los Angeles), quindi
// non serve alcuna mappa endonimo/esonimo come per l'italiano.
const LANG_DEFAULT_COUNTRY: Record<string, string> = {
  it: 'IT',
  es: 'ES',
  en: 'US',
}

const fetchUpstream = async (q: string, limit: number, country: string, lang: string) => {
  const params = new URLSearchParams({ q, limit: String(limit), lang })
  if (country) params.set('country', country)
  const upstream = await fetch(`${BASE_URL}?${params.toString()}`, {
    method: 'GET',
    headers: {
      'x-api-key': API_KEY,
      'Accept-Language': lang,
    },
  })
  if (!upstream.ok) {
    const text = await upstream.text().catch(() => '')
    console.error('city-search upstream error', q, upstream.status, text)
    return null
  }
  return upstream.json()
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { allowed } = await checkRateLimit(req, {
    bucket: 'city-search',
    max: 60,
    windowSeconds: 60,
  })
  if (!allowed) return rateLimitResponse(corsHeaders)

  try {
    const body = await req.json().catch(() => ({}))
    const q = typeof body.q === 'string' ? body.q.trim() : ''
    const country = typeof body.country === 'string' ? body.country.trim().toUpperCase() : ''
    const lang = typeof body.lang === 'string' && body.lang.trim() ? body.lang.trim().toLowerCase() : 'it'
    const limit = Number.isFinite(body.limit) ? Math.max(1, Math.min(50, Number(body.limit))) : 8

    if (q.length < 2) {
      return new Response(JSON.stringify({ results: [], count: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const qLower = q.toLowerCase()
    const cacheKey = `${qLower}|${limit}|${country}|${lang}`
    const cached = cacheGet(cacheKey)
    if (cached) {
      return new Response(JSON.stringify(cached), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
      })
    }

    // Il luogo di nascita puo' essere ovunque, quindi una fetch globale (senza
    // country) garantisce risultati mondiali. La fetch country-scoped assicura
    // che le citta' locali compaiano comunque; il sort sotto le mette in cima.
    // Se q e' prefisso di un endonimo italiano MA NON dell'esonimo inglese,
    // aggiungo una fetch con l'esonimo: upstream indicizza "Rome" non "Roma",
    // quindi q=roma non troverebbe mai Roma IT senza questo.
    const aliasExonym = aliasNeedingSecondFetch(qLower)
    const tasks: Array<{ q: string; country: string }> = [{ q, country: '' }]
    if (country) tasks.push({ q, country })
    if (aliasExonym) tasks.push({ q: aliasExonym, country })

    const responses = await Promise.all(tasks.map((t) => fetchUpstream(t.q, limit, t.country, lang)))
    if (responses.every((r) => r === null)) {
      return new Response(JSON.stringify({ error: 'Upstream geo lookup failed' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Merge + dedup per (lat,lng) arrotondati a 4 decimali (~11m).
    const seen = new Set<string>()
    const merged: any[] = []
    for (const resp of responses) {
      const arr = resp && Array.isArray(resp.results) ? resp.results : []
      for (const r of arr) {
        const key = `${Number(r?.lat).toFixed(4)}|${Number(r?.lng).toFixed(4)}`
        if (seen.has(key)) continue
        seen.add(key)
        merged.push(r)
      }
    }

    // Reorder: il paese richiesto (o, in sua assenza, quello derivato dalla lingua)
    // va in cima, poi population desc. Per en il default e' US, non IT.
    const preferredCountry = country || LANG_DEFAULT_COUNTRY[lang] || 'IT'
    merged.sort((a: any, b: any) => {
      const aPref = a?.country === preferredCountry ? 1 : 0
      const bPref = b?.country === preferredCountry ? 1 : 0
      if (aPref !== bPref) return bPref - aPref
      const aPop = Number(a?.population) || 0
      const bPop = Number(b?.population) || 0
      return bPop - aPop
    })

    // Localizza nomi IT e tronca al limite richiesto.
    const localized = merged.slice(0, limit).map((r: any) => {
      if (r?.country !== 'IT') return r
      return {
        ...r,
        name: localizeIt(r.name, IT_CITY_IT),
        state: localizeIt(r.state, IT_REGION_IT),
        country: 'Italia',
      }
    })

    const payload = { results: localized, count: localized.length }
    cacheSet(cacheKey, payload)

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
    })
  } catch (err) {
    console.error('city-search error', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
