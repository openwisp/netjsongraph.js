/**
 * Centralized Leaflet loader utility
 * Handles conditional loading of Leaflet based on build configuration
 */

let leafletInstance = null;
let isLoaded = false;

/**
 * Get the Leaflet instance, loading it conditionally based on build type
 * @returns {Object|null} Leaflet instance or null if not available in current build
 */
export function getLeaflet() {
  if (isLoaded) {
    return leafletInstance;
  }

  // In test environment, always try to load Leaflet for testing
  const shouldLoadLeaflet =
    (typeof process !== "undefined" &&
      process.env &&
      process.env.NODE_ENV === "test") ||
    // eslint-disable-next-line no-undef
    (typeof __INCLUDE_LEAFLET__ !== "undefined" && __INCLUDE_LEAFLET__);

  if (shouldLoadLeaflet) {
    try {
      // eslint-disable-next-line import/no-dynamic-require,global-require
      leafletInstance = require("leaflet/dist/leaflet");
      isLoaded = true;
      return leafletInstance;
    } catch (error) {
      console.warn("Failed to load Leaflet:", error);
      leafletInstance = null;
    }
  } else {
    const buildType =
      // eslint-disable-next-line no-undef
      typeof __BUILD_TYPE__ !== "undefined" ? __BUILD_TYPE__ : "unknown";
    console.info(`Leaflet not available in ${buildType} bundle`);
    leafletInstance = null;
  }

  isLoaded = true;
  return leafletInstance;
}

const L = getLeaflet();

export default L;
