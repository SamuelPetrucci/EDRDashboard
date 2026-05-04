/**
 * USA (50 states) — same shape as jamaicaParishes rows for jurisdiction switching / testing.
 * Centroids are approximate geographic centers (WGS84).
 */

const US_STATE_ROWS = `
alabama|Alabama|South|4922352|135767|32.806671|-86.791130
alaska|Alaska|West|731158|1730047|64.0685|-153.4937
arizona|Arizona|West|7276316|294207|34.395342|-111.763275
arkansas|Arkansas|South|3017825|53957|34.7465|-92.2896
california|California|West|39461588|423970|36.7783|-119.4179
colorado|Colorado|West|5782172|269601|39.059811|-105.311104
connecticut|Connecticut|Northeast|3617176|5543|41.597782|-72.755371
delaware|Delaware|South|990334|2492|39.3498|-75.5147
florida|Florida|South|21733312|65758|27.766279|-81.686783
georgia|Georgia|South|10711908|59425|33.040619|-83.643074
hawaii|Hawaii|West|1455271|6423|21.094318|-157.498337
idaho|Idaho|West|1826913|83769|44.240459|-114.478828
illinois|Illinois|Midwest|12741080|57914|40.079661|-89.433728
indiana|Indiana|Midwest|6805985|36420|39.849426|-86.258278
iowa|Iowa|Midwest|3163561|56273|42.037386|-93.389526
kansas|Kansas|Midwest|2937922|82278|38.526600|-96.726486
kentucky|Kentucky|South|4509342|40408|37.839333|-84.270018
louisiana|Louisiana|South|4648794|52378|31.0689|-91.9958
maine|Maine|Northeast|1372247|35384|44.693947|-69.381927
maryland|Maryland|South|6165129|12606|39.063946|-76.802101
massachusetts|Massachusetts|Northeast|7029917|10554|42.062939|-71.718067
michigan|Michigan|Midwest|10050811|96714|44.986656|-84.983033
minnesota|Minnesota|Midwest|5707340|86936|46.921925|-94.695530
mississippi|Mississippi|South|2982618|48432|33.0868|-89.7838
missouri|Missouri|Midwest|6164929|69707|38.572954|-92.189283
montana|Montana|West|1086759|380831|46.965260|-109.533691
nebraska|Nebraska|Midwest|1963692|78358|41.527704|-96.759435
nevada|Nevada|West|3104614|110572|41.059548|-114.942458
new-hampshire|New Hampshire|Northeast|1364923|9249|43.452492|-71.563896
new-jersey|New Jersey|Northeast|9294493|8730|39.943436|-74.733346
new-mexico|New Mexico|West|2096829|121590|34.400025|-106.058036
new-york|New York|Northeast|19849399|54475|43.097540|-74.774105
north-carolina|North Carolina|South|10695172|53819|36.068209|-79.867661
north-dakota|North Dakota|Midwest|779948|98381|46.982079|-103.087011
ohio|Ohio|Midwest|11799448|44826|39.974048|-82.983007
oklahoma|Oklahoma|South|3959353|69899|36.084621|-94.932419
oregon|Oregon|West|4233358|98379|43.974459|-119.957511
pennsylvania|Pennsylvania|Northeast|13002700|46134|41.058324|-76.074196
rhode-island|Rhode Island|Northeast|1097379|2776|41.673521|-71.578224
south-carolina|South Carolina|South|5118425|32020|34.067103|-82.068593
south-dakota|South Dakota|Midwest|895376|98239|43.983037|-96.068657
tennessee|Tennessee|South|6910840|41235|36.086445|-83.943754
texas|Texas|South|29527941|695662|31.054487|-97.563461
utah|Utah|West|3271616|219882|41.065471|-107.962867
vermont|Vermont|Northeast|621270|9621|43.974051|-71.074917
virginia|Virginia|South|8631393|42775|39.069306|-77.036512
washington|Washington|West|7705281|184661|46.957458|-118.983000
west-virginia|West Virginia|South|1793716|62756|39.069206|-81.954035
wisconsin|Wisconsin|Midwest|5851754|65496|43.943022|-87.957264
wyoming|Wyoming|West|582328|97105|43.579479|-109.734741
`

function seededEquipment(personSeed) {
  const s = Math.max(12, Math.floor(personSeed % 97) + 20)
  return {
    emergencyVehicles: Math.floor(s * 0.9),
    generators: Math.floor(s * 2.8),
    waterTrucks: Math.max(8, Math.floor(s * 0.22)),
    medicalSupplies: Math.floor(s * 14),
    communicationEquipment: Math.floor(s * 3.8),
    searchAndRescue: Math.max(12, Math.floor(s * 0.35)),
    heavyMachinery: Math.max(8, Math.floor(s * 0.28)),
  }
}

function seededPersonnel(pop) {
  const base = Math.max(80, Math.floor(Math.sqrt(Math.max(pop, 1)) * 3.5))
  return {
    emergencyResponders: Math.floor(base * 1.1),
    medicalStaff: Math.floor(base * 1.55),
    engineers: Math.max(22, Math.floor(base * 0.28)),
    logisticsStaff: Math.max(26, Math.floor(base * 0.36)),
    communicationSpecialists: Math.max(16, Math.floor(base * 0.2)),
    volunteers: Math.floor(base * 4.8),
    coordinators: Math.max(6, Math.floor(base * 0.09)),
  }
}

function buildStates() {
  const lines = US_STATE_ROWS.trim().split('\n').filter(Boolean)
  return lines.map((line) => {
    const [id, name, region, population, areaSqKm, lat, lng] = line.split('|')
    const populationNum = Number(population)
    const areaKm = Number(areaSqKm)
    return {
      id,
      name,
      region,
      population: populationNum,
      area: `${areaKm.toLocaleString()} km²`,
      equipment: seededEquipment(populationNum),
      personnel: seededPersonnel(populationNum),
      scorecard: { overallScore: 0, domains: {} },
      lastUpdated: new Date().toISOString(),
      _centroidLat: Number(lat),
      _centroidLng: Number(lng),
    }
  })
}

const builtStates = buildStates()

/** Map state id → { lat, lng } (matches parishCoordinates shape) */
export const usStateCoordinates = Object.fromEntries(
  builtStates.map((s) => [s.id, { lat: s._centroidLat, lng: s._centroidLng }])
)

export const usStates = builtStates.map(({ _centroidLat, _centroidLng, ...rest }) => rest)

export const getUsStateById = (id) => usStates.find((s) => s.id === id)

export const getAllUsStates = () => usStates
