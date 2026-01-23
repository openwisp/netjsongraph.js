/* eslint-disable import/no-mutable-exports */
/**
 * Leaflet loader - conditionally uses bundled Leaflet or global L
 *
 * This module provides a way to use either:
 * 1. Bundled Leaflet (for full bundle) - imported from 'leaflet' package
 * 2. Global Leaflet (for echarts-only bundle) - expects window.L to be available
 *
 * The BUNDLE_LEAFLET variable is defined by webpack DefinePlugin during build.
 */

let L;

export default function getLeaflet(suppressError = false) {
  if (L) {
    return L;
  }

  // BUNDLE_LEAFLET is defined by webpack DefinePlugin
  // For full build: BUNDLE_LEAFLET = true
  // For echarts-only build: BUNDLE_LEAFLET = false
  // eslint-disable-next-line no-undef
  if (typeof BUNDLE_LEAFLET !== "undefined" && BUNDLE_LEAFLET) {
    // eslint-disable-next-line global-require
    L = require("leaflet");
  } else {
    if (typeof window === "undefined" || !window.L) {
      if (!suppressError) {
        console.error(
          "Leaflet (L) is not defined! Make sure Leaflet is loaded before NetJSONGraph.",
        );
      }
      return undefined;
    }
    L = window.L;
  }
  return L;
}
