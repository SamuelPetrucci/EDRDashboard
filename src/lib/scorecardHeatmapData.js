/**
 * Load latest scorecard snapshots for executive heatmap / tables.
 * Jurisdiction `code` in DB matches app catalog ids (e.g. parish id, US state id).
 */

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {'jamaica'|'united-states'} countrySlug
 * @returns {Promise<Map<string, { score: number|null, classification: string|null, as_of_date: string|null }>>}
 */
export async function fetchLatestSubnationalScoresByJurisdictionCode(supabase, countrySlug) {
  const { data: country, error: cErr } = await supabase.from('countries').select('id').eq('slug', countrySlug).maybeSingle()
  if (cErr || !country?.id) return new Map()

  const { data, error } = await supabase
    .from('scorecard_snapshots')
    .select('jurisdiction_id, overall_score, classification, as_of_date, jurisdictions (code)')
    .eq('country_id', country.id)
    .not('jurisdiction_id', 'is', null)
    .order('as_of_date', { ascending: false })

  if (error || !data?.length) return new Map()

  /** @type {Map<string, { jurisdiction_id: string, overall_score: unknown, classification: string|null, as_of_date: string|null }>} */
  const firstByJurId = new Map()
  for (const row of data) {
    const jid = row.jurisdiction_id
    if (!jid || firstByJurId.has(jid)) continue
    firstByJurId.set(jid, row)
  }

  /** @type {Map<string, { score: number|null, classification: string|null, as_of_date: string|null }>} */
  const byCode = new Map()
  for (const row of firstByJurId.values()) {
    const code = row.jurisdictions?.code
    if (!code) continue
    const raw = row.overall_score
    const score = raw == null || raw === '' ? null : Math.round(Number(raw))
    byCode.set(code, {
      score: Number.isFinite(score) ? score : null,
      classification: row.classification ?? null,
      as_of_date: row.as_of_date ?? null,
    })
  }
  return byCode
}

/**
 * Latest national snapshot (jurisdiction_id IS NULL) for headline score.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {'jamaica'|'united-states'} countrySlug
 */
export async function fetchLatestNationalScorecard(supabase, countrySlug) {
  const { data: country, error: cErr } = await supabase.from('countries').select('id').eq('slug', countrySlug).maybeSingle()
  if (cErr || !country?.id) return null

  const { data, error } = await supabase
    .from('scorecard_snapshots')
    .select('overall_score, classification, as_of_date, domain_scores')
    .eq('country_id', country.id)
    .is('jurisdiction_id', null)
    .order('as_of_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) return null
  const raw = data.overall_score
  const score = raw == null || raw === '' ? null : Math.round(Number(raw))
  return {
    score: Number.isFinite(score) ? score : null,
    classification: data.classification ?? null,
    as_of_date: data.as_of_date ?? null,
    domain_scores: data.domain_scores && typeof data.domain_scores === 'object' ? data.domain_scores : {},
  }
}
