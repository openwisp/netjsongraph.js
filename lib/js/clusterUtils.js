/**
 * Cluster utilities for NetJSONGraph
 * Functions to handle cluster overlapping and arrangement
 */

/**
 * Function to prevent cluster overlap
 * Identifies clusters at the same location and arranges them in a circular pattern
 */
export function preventClusterOverlap() {
  // Find all cluster markers
  const clusterMarkers = document.querySelectorAll('.marker-cluster');
  console.log('Found cluster markers:', clusterMarkers.length);

  if (clusterMarkers.length === 0) {
    return;
  }

  const positions = {};

  // Group markers by position
  clusterMarkers.forEach(marker => {
    const rect = marker.getBoundingClientRect();
    const key = `${Math.round(rect.left)}-${Math.round(rect.top)}`;

    if (!positions[key]) {
      positions[key] = [];
    }
    positions[key].push(marker);
  });

  // Arrange overlapping markers in a circle
  Object.values(positions).forEach(markers => {
    if (markers.length > 1) {
      console.log('Arranging', markers.length, 'overlapping markers');
      const radius = 30; // Distance from center
      const angleStep = (2 * Math.PI) / markers.length;

      markers.forEach((marker, i) => {
        if (i > 0) { // Skip the first marker (keep it at center)
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
  console.log('Setting up cluster overlap prevention...');
  
  // Apply immediately
  preventClusterOverlap();
  
  // Event listeners to the Leaflet map instance for relevant events
  if (leafletMap) {
    // Handle zoom events
    leafletMap.on('zoomend', preventClusterOverlap);
    
    // Handle pan/move events
    leafletMap.on('moveend', preventClusterOverlap);
    
    // Handle when layers are added (which could include clusters)
    leafletMap.on('layeradd', preventClusterOverlap);
    
    // Handle browser resize which might affect the map
    window.addEventListener('resize', preventClusterOverlap);
  } else {
    console.warn('Leaflet map instance not accessible, falling back to limited event handling');
    // Fallback if we can't access the Leaflet map instance
    document.addEventListener('mousemove', () => preventClusterOverlap());
    document.addEventListener('mouseup', () => preventClusterOverlap());
    document.addEventListener('wheel', () => preventClusterOverlap());
  }
} 