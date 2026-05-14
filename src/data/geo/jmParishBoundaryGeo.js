/**
 * Jamaica parish polygons (GADM 4.1 admin level 1) aligned to DRIS catalog ids.
 * Source: https://geodata.ucdavis.edu/gadm/gadm4.1/json/gadm41_JAM_1.json (GADM license).
 */
import raw from './jmGadm41Parishes.json'

/** GADM NAME_1 → catalog jurisdiction id (see `jamaicaParishes.js`) */
const GADM_NAME_TO_DRIS_ID = {
  Clarendon: 'clarendon',
  Hanover: 'hanover',
  Kingston: 'kingston',
  Manchester: 'manchester',
  Portland: 'portland',
  SaintAndrew: 'st-andrew',
  SaintAnn: 'st-ann',
  SaintCatherine: 'st-catherine',
  SaintElizabeth: 'st-elizabeth',
  SaintJames: 'st-james',
  SaintMary: 'st-mary',
  SaintThomas: 'st-thomas',
  Trelawny: 'trelawny',
  Westmoreland: 'westmoreland',
}

/** @type {object} GeoJSON FeatureCollection */
export const JAMAICA_PARISH_BOUNDARY_GEOJSON = {
  type: 'FeatureCollection',
  features: (raw.features || []).map((f) => {
    const name = f?.properties?.NAME_1
    const drisId = name ? GADM_NAME_TO_DRIS_ID[name] : null
    return {
      ...f,
      properties: {
        ...f.properties,
        dris_jurisdiction_id: drisId,
      },
    }
  }),
}
