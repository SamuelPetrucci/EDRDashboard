import { useMemo, useCallback } from 'react'
import { MapContainer, TileLayer, Circle, Popup, Tooltip, GeoJSON } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './JurisdictionScoreHeatmap.css'

/**
 * Choropleth from optional GeoJSON boundaries (parish / state polygons) or centroid circles.
 * @param {{
 *   rows: Array<{ id: string, name?: string, score: number, band: { label: string } }>,
 *   coordinates: Record<string, { lat: number, lng: number }>,
 *   fallbackCenter?: { lat: number, lng: number },
 *   radiusForId?: (id: string) => number,
 *   ariaLabel?: string,
 *   boundaryGeoJson?: import('geojson').FeatureCollection | null,
 * }} props
 */
export default function JurisdictionScoreHeatmap({
  rows,
  coordinates,
  fallbackCenter = { lat: 18.1096, lng: -77.2975 },
  radiusForId = defaultRadiusForId,
  ariaLabel = 'Jurisdiction score heat map',
  boundaryGeoJson = null,
}) {
  const rowById = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows])

  const { bounds, circles, usePolygons } = useMemo(() => {
    if (boundaryGeoJson && Array.isArray(boundaryGeoJson.features) && boundaryGeoJson.features.length > 0) {
      try {
        const layer = L.geoJSON(boundaryGeoJson)
        const b = layer.getBounds()
        if (b.isValid()) {
          b.pad(0.08)
          return { bounds: b, circles: [], usePolygons: true }
        }
      } catch {
        /* fall through */
      }
    }

    const list = rows.filter((r) => coordinates[r.id])
    if (list.length === 0) {
      return {
        bounds: L.latLngBounds(
          [fallbackCenter.lat - 0.35, fallbackCenter.lng - 0.45],
          [fallbackCenter.lat + 0.35, fallbackCenter.lng + 0.45]
        ),
        circles: [],
        usePolygons: false,
      }
    }
    const latLngs = list.map((r) => {
      const c = coordinates[r.id]
      return [c.lat, c.lng]
    })
    const b = L.latLngBounds(latLngs)
    b.pad(0.12)

    const circlesData = list.map((r) => {
      const c = coordinates[r.id]
      const { fill, stroke } = scorePalette(r.score)
      const radiusM = radiusForId(r.id)
      return { ...r, lat: c.lat, lng: c.lng, fill, stroke, radiusM }
    })

    return { bounds: b, circles: circlesData, usePolygons: false }
  }, [rows, coordinates, fallbackCenter, radiusForId, boundaryGeoJson])

  const polygonStyle = useCallback(
    (feature) => {
      const id = feature?.properties?.dris_jurisdiction_id
      const row = id ? rowById.get(id) : null
      if (!id || !row) {
        return {
          fillColor: '#e2e8f0',
          color: '#94a3b8',
          weight: 1,
          fillOpacity: 0.35,
          opacity: 0.9,
        }
      }
      const { fill, stroke } = scorePalette(row.score)
      return {
        fillColor: fill,
        color: stroke,
        weight: 2,
        fillOpacity: 0.45,
        opacity: 0.95,
      }
    },
    [rowById]
  )

  const onEachPolygon = useCallback(
    (feature, layer) => {
      const id = feature?.properties?.dris_jurisdiction_id
      const row = id ? rowById.get(id) : null
      if (!row) return
      layer.bindPopup(
        `<div class="jm-heatmap__popup"><strong>${row.name || row.id}</strong><div>Score: <strong>${row.score}</strong> / 100</div><div>Band: ${row.band?.label ?? ''}</div></div>`
      )
    },
    [rowById]
  )

  return (
    <div className="jm-heatmap" role="region" aria-label={ariaLabel}>
      <MapContainer
        className="jm-heatmap__map"
        bounds={bounds}
        boundsOptions={{ padding: [16, 16] }}
        scrollWheelZoom={false}
        zoomControl
        attributionControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {usePolygons && boundaryGeoJson ? (
          <GeoJSON data={boundaryGeoJson} style={polygonStyle} onEachFeature={onEachPolygon} />
        ) : (
          circles.map((r) => (
            <Circle
              key={r.id}
              center={[r.lat, r.lng]}
              radius={r.radiusM}
              pathOptions={{
                color: r.stroke,
                weight: 2,
                fillColor: r.fill,
                fillOpacity: 0.45,
                opacity: 0.95,
              }}
            >
              <Tooltip direction="top" offset={[0, -6]} opacity={0.95} permanent={false}>
                <span className="jm-heatmap__tip">
                  {r.name || r.id} · {r.score}
                </span>
              </Tooltip>
              <Popup>
                <div className="jm-heatmap__popup">
                  <strong>{r.name || r.id}</strong>
                  <div>
                    Score: <strong>{r.score}</strong> / 100
                  </div>
                  <div>Band: {r.band?.label}</div>
                </div>
              </Popup>
            </Circle>
          ))
        )}
      </MapContainer>
      <div className="jm-heatmap__legend" aria-hidden="true">
        <span className="jm-heatmap__legend-title">Score</span>
        <span className="jm-heatmap__sw jm-heatmap__sw--hi" /> 85+
        <span className="jm-heatmap__sw jm-heatmap__sw--mid" /> 70–84
        <span className="jm-heatmap__sw jm-heatmap__sw--lo" /> 50–69
        <span className="jm-heatmap__sw jm-heatmap__sw--vlo" /> &lt;50
      </div>
    </div>
  )
}

function defaultRadiusForId(id) {
  const large = ['st-catherine', 'clarendon', 'st-ann', 'st-elizabeth', 'trelawny', 'st-james', 'manchester', 'westmoreland']
  const medium = ['st-andrew', 'st-mary', 'portland', 'st-thomas', 'hanover']
  if (large.includes(id)) return 18500
  if (medium.includes(id)) return 14500
  return 11000
}

function scorePalette(score) {
  if (score >= 85) return { fill: '#059669', stroke: '#047857' }
  if (score >= 70) return { fill: '#34d399', stroke: '#059669' }
  if (score >= 50) return { fill: '#fbbf24', stroke: '#d97706' }
  return { fill: '#fb923c', stroke: '#c2410c' }
}
