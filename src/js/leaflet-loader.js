/**
 * Centralized Leaflet loader utility
 * Handles conditional loading of Leaflet based on build configuration
 */

let leafletInstance = null;

/**
 * Get the Leaflet instance, loading it conditionally based on build type
 * @returns {Object|null} Leaflet instance or null if not available in current build
 */
export function getLeaflet() {
  if (leafletInstance !== null) return leafletInstance;

  try {
    // eslint-disable-next-line import/no-dynamic-require,global-require
    leafletInstance = require("leaflet/dist/leaflet");
  } catch (error) {
    console.warn("Failed to load Leaflet:", error);
    leafletInstance = null;
  }

  return leafletInstance;
}

export default getLeaflet();
