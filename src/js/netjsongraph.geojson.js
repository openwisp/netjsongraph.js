/*
 * Dedicated GeoJSON utilities for netjsongraph.js.
 */

import L from "leaflet/dist/leaflet";

/**
 * Convert a GeoJSON FeatureCollection into a NetJSON-style object
 * (nodes / links arrays) so that the rest of the rendering pipeline can work
 * in a uniform way.
 *
 * @param {Object} geojson  A GeoJSON FeatureCollection
 * @return {{nodes:Array, links:Array}}
 */
export function geojsonToNetjson(geojson) {
  const nodes = [];
  const links = [];

  if (!geojson || !Array.isArray(geojson.features)) {
    return {nodes, links};
  }

  // Coordinate string → node id (deduplication across features)
  const coordMap = new Map();

  const createNode = (coord, baseProps = {}) => {
    const key = `${coord[0]},${coord[1]}`;
    if (coordMap.has(key)) {
      return coordMap.get(key); // reuse existing node id
    }

    // If the data source specifies an identifier (or label) keep it public,
    // otherwise generate an internal id and flag it so UI layers can hide it.
    const providedId = baseProps.id || baseProps.node_id || null;
    const displayLabel = baseProps.label || baseProps.name || providedId || null;

    const newId = providedId ? String(providedId) : `gjn_${nodes.length}`;
    const generatedIdentity = !providedId;

    const node = {
      id: newId,
      ...(displayLabel ? {label: String(displayLabel)} : {}),
      location: {lng: coord[0], lat: coord[1]},
      properties: {
        ...baseProps,
        location: {lng: coord[0], lat: coord[1]},
      },
      _generatedIdentity: generatedIdentity, // internal marker – not shown to users
    };
    nodes.push(node);
    coordMap.set(key, newId);
    return newId;
  };

  const addEdge = (sourceId, targetId, props = {}) => {
    links.push({source: sourceId, target: targetId, properties: props});
  };

  const processCoordsSeq = (coords, props, closeRing = false) => {
    for (let i = 0; i < coords.length - 1; i += 1) {
      const a = createNode(coords[i], props);
      const b = createNode(coords[i + 1], props);
      addEdge(a, b, props);
    }
    if (closeRing && coords.length > 2) {
      // close the polygon ring (ensure topology correctness)
      const first = createNode(coords[0], props);
      const last = createNode(coords[coords.length - 1], props);
      addEdge(last, first, props);
    }
  };

  const handleGeometry = (geometry, props) => {
    if (!geometry) return;
    const {type, coordinates, geometries} = geometry;
    switch (type) {
      case "Point":
        // Mark nodes derived from Point features so we can selectively display them later
        createNode(coordinates, {...props, _featureType: "Point"});
        break;
      case "MultiPoint":
        coordinates.forEach((pt) => createNode(pt, {...props, _featureType: "Point"}));
        break;
      case "LineString":
        // Tag nodes coming from line geometries
        processCoordsSeq(coordinates, {...props, _featureType: "LineString"}, false);
        break;
      case "MultiLineString":
        coordinates.forEach((line) =>
          processCoordsSeq(line, {...props, _featureType: "LineString"}, false),
        );
        break;
      case "Polygon":
        break;
      case "MultiPolygon":
        break;
      case "GeometryCollection":
        geometries.forEach((g) => handleGeometry(g, props));
        break;
      default:
        console.warn(`Unsupported GeoJSON geometry type: ${type}`);
    }
  };

  geojson.features.forEach((feature) => {
    // Start with existing properties, then add top-level Feature info we want to preserve.
    const baseProps = {
      ...(feature.properties || {}),
      // Preserve original GeoJSON feature id (location primary-key) if present.
      ...(feature.id !== undefined && feature.id !== null ? {id: feature.id} : {}),
    };

    handleGeometry(feature.geometry, baseProps);
  });

  return {nodes, links};
}

/**
 * Add Polygon / MultiPolygon overlays from the original GeoJSON (if present)
 * onto the provided Leaflet map instance. This must be called *after* the
 * base map is initialised inside `mapRender` but before we start reacting to
 * map events, otherwise the overlay pane Z-index might be wrong.
 *
 * It attaches the resulting layer to `self.leaflet.polygonGeoJSON` so that
 * callers can later remove / update it if needed.
 *
 * @param {Object} self   NetJSONGraph instance (provides leaflet + config)
 */
export function addPolygonOverlays(self) {
  if (!self.originalGeoJSON || !Array.isArray(self.originalGeoJSON.features)) {
    return; // nothing to do
  }

  const map = self.leaflet; // Leaflet map instance
  const polygonFeatures = self.originalGeoJSON.features.filter(
    (f) =>
      f &&
      f.geometry &&
      (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon"),
  );

  if (!polygonFeatures.length) return;

  let polygonPane = map.getPane("njg-polygons");
  if (!polygonPane) {
    polygonPane = map.createPane("njg-polygons");
    polygonPane.style.zIndex = 410; // above overlayPane (400)
  }

  const defaultStyle = {
    fillColor: "#1566a9",
    color: "#1566a9",
    weight: 0,
    fillOpacity: 0.6,
  };

  const polygonLayer = L.geoJSON(
    {type: "FeatureCollection", features: polygonFeatures},
    {
      pane: "njg-polygons",
      style: (feature) => {
        const echartsStyle =
          (feature.properties && feature.properties.echartsStyle) || {};
        const leafletStyle = {
          ...defaultStyle,
          ...(self.config.geoOptions && self.config.geoOptions.style),
        };
        if (echartsStyle.areaColor) leafletStyle.fillColor = echartsStyle.areaColor;
        if (echartsStyle.color) leafletStyle.color = echartsStyle.color;
        if (typeof echartsStyle.opacity !== "undefined")
          leafletStyle.fillOpacity = echartsStyle.opacity;
        if (typeof echartsStyle.borderWidth !== "undefined")
          leafletStyle.weight = echartsStyle.borderWidth;
        return leafletStyle;
      },
      onEachFeature: (feature, layer) => {
        layer.on("click", () => {
          // Re-emit GeoJSON feature click using existing callback for uniformity
          const properties = feature.properties || {};
          self.config.onClickElement.call(self, "Feature", properties);
        });
      },
      ...self.config.geoOptions,
    },
  ).addTo(map);

  self.leaflet.polygonGeoJSON = polygonLayer;
}
