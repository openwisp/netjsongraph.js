import getLeaflet from "./leaflet-loader";
/*
 * Dedicated GeoJSON utilities for netjsongraph.js.
 */

// Start with the feature properties, then keep the top-level GeoJSON feature
// id (location primary-key) if present.
const getFeatureProps = (feature) => ({
  ...((feature && feature.properties) || {}),
  ...(feature && feature.id !== undefined && feature.id !== null
    ? {id: feature.id}
    : {}),
});

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

  // Coordinate string → node id. Only used for the vertices of LineString /
  // MultiLineString features, so that lines which meet share one node.
  const coordMap = new Map();

  // Every explicit id in the collection, collected up front so that a
  // suffixed MultiPoint id never takes an id another feature already uses,
  // even when that feature comes later (e.g. MultiPoint "mp" and Point "mp_0").
  // The ids are read from the same props, with the same fallback, that
  // createNode uses, so the reserved id is exactly the id the node gets.
  const usedIds = new Set();
  geojson.features.forEach((feature) => {
    const props = getFeatureProps(feature);
    const explicitId = props.id || props.node_id;
    if (explicitId) {
      usedIds.add(String(explicitId));
    }
  });

  // Return the first `${base}_${n}` (n >= start) not used by any other node.
  // Each base resumes from its last suffix, since the lower ones are taken.
  const nextSuffix = new Map();
  const uniqueSuffixedId = (base, start) => {
    let n = Math.max(start, nextSuffix.get(base) || 0);
    while (usedIds.has(`${base}_${n}`)) {
      n += 1;
    }
    const id = `${base}_${n}`;
    usedIds.add(id);
    nextSuffix.set(base, n + 1);
    return id;
  };

  // Always create a new node and return its id. Features that are Points are
  // independent locations, so they must never be merged with another node.
  const createNode = (coord, baseProps = {}, idSuffix = null) => {
    // If the data source specifies an identifier (or label) keep it public,
    // otherwise generate an internal id and flag it so UI layers can hide it.
    const providedId = baseProps.id || baseProps.node_id || null;
    const displayLabel =
      baseProps.label || baseProps.name || providedId || null;

    // A MultiPoint creates several nodes from one feature, so its explicit id
    // gets a suffix that no other feature uses, keeping every graph id unique.
    // The original id stays in properties.id, or in properties.node_id when
    // properties.id is missing or falsy, such as 0. The label is label or
    // name when set, otherwise the explicit id without any MultiPoint suffix.
    let newId;
    if (!providedId) {
      newId = uniqueSuffixedId("gjn", nodes.length);
    } else if (idSuffix === null) {
      newId = String(providedId);
    } else {
      newId = uniqueSuffixedId(providedId, idSuffix);
    }
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
    return newId;
  };

  // Return the node id for a line vertex: reuse the node already created for
  // the same coordinates by a line, or create (and remember) a new one.
  const getVertexNode = (coord, baseProps = {}) => {
    const key = `${coord[0]},${coord[1]}`;
    if (coordMap.has(key)) {
      return coordMap.get(key); // reuse existing node id
    }
    const newId = createNode(coord, baseProps);
    coordMap.set(key, newId);
    return newId;
  };

  const addEdge = (sourceId, targetId, props = {}) => {
    links.push({source: sourceId, target: targetId, properties: props});
  };

  const processCoordsSeq = (coords, props, closeRing = false) => {
    for (let i = 0; i < coords.length - 1; i += 1) {
      const a = getVertexNode(coords[i], props);
      const b = getVertexNode(coords[i + 1], props);
      addEdge(a, b, props);
    }
    if (closeRing && coords.length > 2) {
      // close the polygon ring (ensure topology correctness)
      const first = getVertexNode(coords[0], props);
      const last = getVertexNode(coords[coords.length - 1], props);
      addEdge(last, first, props);
    }
  };

  const handleGeometry = (geometry, props) => {
    if (!geometry) {
      return;
    }
    const {type, coordinates, geometries} = geometry;
    switch (type) {
      case "Point":
        // Mark nodes derived from Point features so we can selectively display them later
        createNode(coordinates, {...props, _featureType: "Point"});
        break;
      case "MultiPoint":
        coordinates.forEach((pt, index) =>
          createNode(pt, {...props, _featureType: "Point"}, index),
        );
        break;
      case "LineString":
        // Tag nodes coming from line geometries
        processCoordsSeq(
          coordinates,
          {...props, _featureType: "LineString"},
          false,
        );
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
    handleGeometry(feature.geometry, getFeatureProps(feature));
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

  const L = getLeaflet();
  if (!L) {
    return;
  }
  const {geoJSON} = L;

  const map = self.leaflet; // Leaflet map instance
  const polygonFeatures = self.originalGeoJSON.features.filter(
    (f) =>
      f &&
      f.geometry &&
      (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon"),
  );

  if (!polygonFeatures.length) {
    return;
  }

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

  const polygonLayer = geoJSON(
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
        if (echartsStyle.areaColor) {
          leafletStyle.fillColor = echartsStyle.areaColor;
        }
        if (echartsStyle.color) {
          leafletStyle.color = echartsStyle.color;
        }
        if (typeof echartsStyle.opacity !== "undefined") {
          leafletStyle.fillOpacity = echartsStyle.opacity;
        }
        if (typeof echartsStyle.borderWidth !== "undefined") {
          leafletStyle.weight = echartsStyle.borderWidth;
        }
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
