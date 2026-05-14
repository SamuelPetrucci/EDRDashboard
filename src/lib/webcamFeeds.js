/**
 * Webcam APIs (Windy Webcams, OpenWebcamDB, same-origin proxy) — opt-in.
 * Requires external intel feeds (`VITE_ENABLE_EXTERNAL_INTEL_FEEDS=true`) as well.
 * camera endpoints unless both are true.
 *
 * `.env`: VITE_ENABLE_WEBCAM_FEEDS=true
 */
export function isWebcamFeedsEnabled() {
  if (typeof import.meta === 'undefined') return false
  return import.meta.env?.VITE_ENABLE_WEBCAM_FEEDS === 'true'
}
