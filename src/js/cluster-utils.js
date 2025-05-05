/**
 * Cluster utilities for NetJSONGraph
 * Functions to handle cluster overlapping and arrangement
 */

/**
 * Function to prevent cluster overlap
 * Identifies clusters at the same location and arranges them in a circular pattern
 */
export function preventClusterOverlap() {
  const clusterMarkers = document.querySelectorAll(".marker-cluster");

  if (clusterMarkers.length === 0) {
    return;
  }

  const positions = {};

  clusterMarkers.forEach((marker) => {
    const rect = marker.getBoundingClientRect();
    const key = `${Math.round(rect.left)}-${Math.round(rect.top)}`;

    if (!positions[key]) {
      positions[key] = [];
    }
    positions[key].push(marker);
  });

  // Arrange overlapping markers in a circle
  Object.values(positions).forEach((markers) => {
    if (markers.length > 1) {
      const radius = 30; // Distance from center
      const angleStep = (2 * Math.PI) / markers.length;

      markers.forEach((marker, i) => {
        if (i > 0) {
          // Skip the first marker (keep it at center)
          const angle = angleStep * i;
          const offsetX = radius * Math.cos(angle);
          const offsetY = radius * Math.sin(angle);

          marker.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
          marker.style.zIndex = 1000 + i; // Ensure visibility
        }
      });
    }
  });
}

/**
 * Sets up event listeners for cluster overlap prevention
 * @param {Object} leafletMap - The Leaflet map instance
 */
export function setupClusterOverlapPrevention(leafletMap) {
  // Apply immediately
  preventClusterOverlap();

  if (leafletMap) {
    leafletMap.on("zoomend", preventClusterOverlap);
    leafletMap.on("moveend", preventClusterOverlap);
    leafletMap.on("layeradd", preventClusterOverlap);

    window.addEventListener("resize", preventClusterOverlap);
  } else {
    console.warn(
      "[NetJSONGraph] setupClusterOverlapPrevention: Leaflet map instance is required for cluster overlap prevention.",
    );
  }
}
