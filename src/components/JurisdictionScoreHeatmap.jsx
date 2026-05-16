import { useMemo, useCallback } from 'react'
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import './JurisdictionScoreHeatmap.css'

/** @param {number|null|undefined} score */
export function scoreBandFill(score) {
  if (score == null || Number.isNaN(score)) return '#94a3b8'
  if (score >= 80) return '#059669'
  if (score >= 60) return '#d97706'
  return '#ea580c'
}

function defaultRadiusForId(id, rowsWithPop) {
  const row = rowsWithPop?.find((r) => r.id === id)
  const pop = row?.population ?? 60000
  return Math.max(10, Math.min(30, Math.sqrt(pop / 2500)))
}

/**
 * Choropleth from GeoJSON boundaries (e.g. Jamaica parishes) or centroid markers when polygons unavailable.
 * @param {{
 *   rows: Array<{ id: string, name?: string, score: number|null, band?: { label?: string }, population?: number }>,
 *   coordinates: Record<string, { lat: number, lng: number }>,
 *   fallbackCenter?: { lat: number, lng: number },
 *   leafletZoom?: number,
 *   radiusForId?: (id: string) => number,
 *   ariaLabel?: string,
 *   boundaryGeoJson?: import('geojson').FeatureCollection | null,
 * }} props
 */
export default function JurisdictionScoreHeatmap({
  rows,
  coordinates,
  fallbackCenter = { lat: 18.1096, lng: -77.2975 },
  leafletZoom = 8,
  radiusForId,
  ariaLabel = 'Jurisdiction readiness heat map',
  boundaryGeoJson = null,
}) {
  const rowById = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows])

  /** Force GeoJSON repaint when scores change (react-leaflet does not diff style deeply). */
  const rowsSig = useMemo(() => rows.map((r) => `${r.id}:${r.score ?? 'x'}`).join('|'), [rows])

  const resolveRadius = useCallback(
    (id) => {
      if (typeof radiusForId === 'function') return radiusForId(id)
      return defaultRadiusForId(id, rows)
    },
    [radiusForId, rows]
  )

  const geoJsonStyle = useCallback(
    (feature) => {
      const id = feature?.properties?.dris_jurisdiction_id
      const row = id ? rowById.get(id) : null
      const fill = scoreBandFill(row?.score ?? null)
      return {
        fillColor: fill,
        fillOpacity: 0.58,
        color: '#1e293b',
        weight: 1.2,
      }
    },
    [rowById]
  )

  const onEachFeature = useCallback(
    (feature, layer) => {
      const id = feature?.properties?.dris_jurisdiction_id
      if (!id) return
      const row = rowById.get(id)
      const label = row?.name ?? feature.properties?.NAME_1 ?? id
      const scoreLabel =
        row?.score != null && !Number.isNaN(row.score) ? `${Math.round(row.score)} / 100` : 'No assessment'
      const bandLabel = row?.band?.label ?? ''
      layer.bindPopup(
        `<div class="jm-heatmap-popup"><strong>${escapeHtml(label)}</strong><div>Score: <strong>${escapeHtml(scoreLabel)}</strong></div>${bandLabel ? `<div>${escapeHtml(bandLabel)}</div>` : ''}</div>`
      )
    },
    [rowById]
  )

  const idsWithPolygon = useMemo(() => {
    if (!boundaryGeoJson?.features?.length) return new Set()
    const s = new Set()
    for (const f of boundaryGeoJson.features) {
      const id = f?.properties?.dris_jurisdiction_id
      if (id) s.add(id)
    }
    return s
  }, [boundaryGeoJson])

  return (
    <div className="jm-heatmap" role="region" aria-label={ariaLabel}>
      <MapContainer className="jm-heatmap__map" center={[fallbackCenter.lat, fallbackCenter.lng]} zoom={leafletZoom} scrollWheelZoom>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {boundaryGeoJson ? (
          <GeoJSON key={rowsSig} data={boundaryGeoJson} style={geoJsonStyle} onEachFeature={onEachFeature} />
        ) : null}
        {rows.map((row) => {
          const coord = coordinates[row.id]
          if (!coord) return null
          if (boundaryGeoJson && idsWithPolygon.has(row.id)) return null
          const fill = scoreBandFill(row.score)
          const r = resolveRadius(row.id)
          return (
            <CircleMarker key={`centroid-${row.id}`} center={[coord.lat, coord.lng]} radius={r} pathOptions={{ fillColor: fill, fillOpacity: 0.72, color: '#1e293b', weight: 1.5 }}>
              <Tooltip direction="top" opacity={0.92}>
                {row.name ?? row.id}: {row.score != null ? `${Math.round(row.score)} / 100` : 'No assessment'}
              </Tooltip>
              <Popup>
                <div className="jm-heatmap-popup">
                  <strong>{row.name ?? row.id}</strong>
                  <div>
                    Score: <strong>{row.score != null ? `${Math.round(row.score)} / 100` : 'No assessment'}</strong>
                  </div>
                  {row.band?.label ? <div>{row.band.label}</div> : null}
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
      <div className="jm-heatmap__legend" aria-hidden="true">
        <span className="jm-heatmap__legend-title">Readiness</span>
        <span className="jm-heatmap__sw jm-heatmap__sw--hi" /> 80–100 (Resilient)
        <span className="jm-heatmap__sw jm-heatmap__sw--mid" /> 60–79 (Thriving)
        <span className="jm-heatmap__sw jm-heatmap__sw--lo" /> &lt;60 (Needs support)
        <span className="jm-heatmap__sw jm-heatmap__sw--na" /> No assessment
      </div>
    </div>
  )
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
