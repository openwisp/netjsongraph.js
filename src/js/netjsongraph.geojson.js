import getLeaflet from "./leaflet-loader";
/*
 * Dedicated GeoJSON utilities for netjsongraph.js.
 */

/**
 * Signed area and centroid of a ring, computed with the shoelace formula.
 *
 * @param {Array} ring  Array of [lng, lat] positions
 * @return {{area:number, centroid:Array}}
 */
const measureRing = (ring) => {
  const [x0, y0] = ring[0];
  let area = 0;
  let x = 0;
  let y = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const xi = ring[i][0] - x0;
    const yi = ring[i][1] - y0;
    const xj = ring[j][0] - x0;
    const yj = ring[j][1] - y0;
    const cross = xj * yi - xi * yj;
    area += cross;
    x += (xi + xj) * cross;
    y += (yi + yj) * cross;
  }
  return {area: area / 2, centroid: [x0 + x / (3 * area), y0 + y / (3 * area)]};
};

/**
 * Longitudes at which the horizontal line at latitude `y` crosses the rings.
 * An edge is crossed only when its ends lie on opposite sides of the line,
 * so a line through a vertex is counted once.
 */
const crossings = (rings, y) => {
  const xs = [];
  rings.forEach((ring) => {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > y !== yj > y) {
        xs.push(((xj - xi) * (y - yi)) / (yj - yi) + xi);
      }
    }
  });
  return xs.sort((a, b) => a - b);
};

/**
 * Position guaranteed to lie within a Polygon or MultiPolygon geometry.
 *
 * The centroid is preferred, but it can fall outside concave polygons or
 * inside holes. In that case the middle of the widest stretch of polygon
 * on the horizontal line through the centroid is returned. A MultiPolygon
 * is represented by its polygon with the largest area, holes excluded.
 *
 * @param {Object} geometry  GeoJSON Polygon or MultiPolygon geometry
 * @return {Array|null}  [lng, lat], null if the geometry has no positions
 */
const interiorPoint = ({type, coordinates}) => {
  const polygons = type === "Polygon" ? [coordinates] : coordinates;
  let rings = null;
  let filled = null;
  (polygons || []).forEach((polygon) => {
    if (!Array.isArray(polygon) || !Array.isArray(polygon[0]) || !polygon[0].length) {
      return;
    }
    // The holes are subtracted from the area and from its moments, which
    // give the centroid of the filled shape
    const shape = {area: 0, x: 0, y: 0};
    polygon.forEach((ring, i) => {
      if (!Array.isArray(ring) || !ring.length) {
        return;
      }
      const {area, centroid} = measureRing(ring);
      if (!area) {
        return;
      }
      const weight = i ? -Math.abs(area) : Math.abs(area);
      shape.area += weight;
      shape.x += weight * centroid[0];
      shape.y += weight * centroid[1];
    });
    if (!rings || shape.area > filled.area) {
      rings = polygon;
      filled = shape;
    }
  });
  if (!rings) {
    return null;
  }
  const first = rings[0][0].slice(0, 2);
  if (filled.area <= 0) {
    return first;
  }
  const x = filled.x / filled.area;
  const y = filled.y / filled.area;
  const xs = crossings(rings, y);
  // Crossings alternate between entering and leaving the polygon,
  // holes included, hence each consecutive pair delimits an inner stretch.
  let middle = null;
  let width = 0;
  for (let i = 0; i + 1 < xs.length; i += 2) {
    if (xs[i] <= x && x <= xs[i + 1]) {
      return [x, y];
    }
    if (xs[i + 1] - xs[i] > width) {
      width = xs[i + 1] - xs[i];
      middle = (xs[i] + xs[i + 1]) / 2;
    }
  }
  return middle === null ? first : [middle, y];
};

/**
 * An empty identifier counts as absent.
 *
 * @param {*} value  Identifier of a feature
 * @return {*}
 */
const present = (value) => (value === "" ? null : value);

/**
 * Whether a node stands for a polygon. The type is set by the conversion,
 * unlike the other properties, which may come from the data.
 *
 * @param {Object} node  Node of the converted data
 * @return {boolean}
 */
// eslint-disable-next-line no-underscore-dangle
export const isPolygon = (node) => node.properties?._featureType === "Polygon";

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
  // Polygons have their own sequence of generated ids, hence they do not
  // shift the generated ids of the other nodes, which may be bookmarked.
  let polygonCount = 0;

  const addNode = (coord, baseProps, idPrefix, generatedId) => {
    // If the data source specifies an identifier (or label) keep it public,
    // otherwise generate an internal id and flag it so UI layers can hide it.
    const providedId = present(baseProps.id) ?? present(baseProps.node_id) ?? null;
    const hasId = providedId !== null;
    const displayLabel =
      baseProps.label || baseProps.name || (hasId ? String(providedId) : null);
    const id = hasId ? `${idPrefix}${providedId}` : generatedId;
    nodes.push({
      id,
      ...(displayLabel ? {label: String(displayLabel)} : {}),
      location: {lng: coord[0], lat: coord[1]},
      properties: {
        ...baseProps,
        location: {lng: coord[0], lat: coord[1]},
      },
      _generatedIdentity: !hasId, // internal marker – not shown to users
    });
    return id;
  };

  const createNode = (coord, baseProps = {}) => {
    const key = `${coord[0]},${coord[1]}`;
    if (coordMap.has(key)) {
      return coordMap.get(key); // reuse existing node id
    }
    const id = addNode(coord, baseProps, "", `gjn_${nodes.length - polygonCount}`);
    coordMap.set(key, id);
    return id;
  };

  // A polygon's node is never merged with other nodes, which may share its
  // position by chance.
  const createPolygonNode = (coord, baseProps) => {
    addNode(coord, baseProps, "polygon_", `gjn_polygon_${polygonCount}`);
    polygonCount += 1;
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

  const handleGeometry = (geometry, props, index = null) => {
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
      case "MultiPolygon": {
        // Polygons nested in a GeometryCollection are not drawn as overlays,
        // hence they have no index and get no node.
        const point = index === null ? null : interiorPoint(geometry);
        if (point) {
          createPolygonNode(point, {
            ...props,
            _featureType: "Polygon",
            _featureIndex: index,
          });
        }
        break;
      }
      case "GeometryCollection":
        geometries.forEach((g) => handleGeometry(g, props));
        break;
      default:
        console.warn(`Unsupported GeoJSON geometry type: ${type}`);
    }
  };

  geojson.features.forEach((feature, index) => {
    // Start with existing properties, then add top-level Feature info we want to preserve.
    const baseProps = {
      ...(feature.properties || {}),
      // Preserve original GeoJSON feature id (location primary-key) if present.
      ...(feature.id !== undefined && feature.id !== null ? {id: feature.id} : {}),
    };

    handleGeometry(feature.geometry, baseProps, index);
  });

  const usedIds = new Set(
    nodes.filter((node) => !isPolygon(node)).map((node) => node.id),
  );
  nodes.forEach((node) => {
    if (!isPolygon(node)) {
      return;
    }
    const {id} = node;
    for (let n = 2; usedIds.has(node.id); n += 1) {
      node.id = `${id}_${n}`;
    }
    if (node.id !== id) {
      console.warn(`Node id "${id}" is taken, hence "${node.id}" is used.`);
    }
    usedIds.add(node.id);
  });

  return {nodes, links};
}

/**
 * Polygons are drawn by Leaflet, hence clicking them does not reach ECharts.
 * This forwards the click to the ECharts click handler on behalf of the node
 * which stands for the polygon, so that polygons behave like the other
 * nodes (URL fragment, popup).
 *
 * @param {Object} self     NetJSONGraph instance
 * @param {Object} feature  GeoJSON feature of the clicked polygon
 * @param {Object} event    Leaflet mouse event
 */
export function clickPolygonNode(self, feature, event) {
  const node = self.polygonNodes?.get(feature);
  if (!node || typeof self.echartsClickHandler !== "function") {
    return;
  }
  // Polygons have no marker which could be highlighted in place of the previous element
  if (typeof self.utils.clearHighlight === "function") {
    self.utils.clearHighlight.call(self);
  }
  // The clicked position is always within the polygon, unlike its node
  // when the click lands on another part of a MultiPolygon.
  const location = event.latlng
    ? {lat: event.latlng.lat, lng: event.latlng.lng}
    : node.location;
  self.echartsClickHandler({
    componentSubType: "scatter",
    seriesType: "scatter",
    event: event.originalEvent,
    data: {node: {...node, location, properties: {...node.properties, location}}},
  });
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
 * Only polygons whose node is among `nodes` are drawn, as the others were
 * dropped by `maxPointsFetched` and could not be clustered, opened or
 * bookmarked.
 *
 * @param {Object} self   NetJSONGraph instance (provides leaflet + config)
 * @param {Array}  nodes  Nodes of the converted data
 */
export function addPolygonOverlays(self, nodes = self.data?.nodes || []) {
  // A previous render left its group on the map, out of reach of clustering
  if (self.leaflet?.polygonGeoJSON) {
    self.leaflet.removeLayer(self.leaflet.polygonGeoJSON);
    delete self.leaflet.polygonGeoJSON;
  }
  delete self.polygonNodes;
  if (!self.originalGeoJSON || !Array.isArray(self.originalGeoJSON.features)) {
    return; // nothing to do
  }

  const L = getLeaflet();
  if (!L) {
    return;
  }
  const {geoJSON} = L;

  const map = self.leaflet; // Leaflet map instance
  // Lets clickPolygonNode find the node of a clicked feature without a search
  self.polygonNodes = new Map(
    nodes.filter(isPolygon).map((node) => [
      // eslint-disable-next-line no-underscore-dangle
      self.originalGeoJSON.features[node.properties._featureIndex],
      node,
    ]),
  );
  const polygonFeatures = self.originalGeoJSON.features.filter((f) =>
    self.polygonNodes.has(f),
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
      ...self.config.geoOptions,
    },
  ).addTo(map);

  self.leaflet.polygonGeoJSON = polygonLayer;
}

/**
 * Hide the polygon overlays whose node belongs to one of the given clusters
 * and show all the others.
 *
 * @param {Object} self      NetJSONGraph instance
 * @param {Array}  clusters  Clusters currently displayed on the map
 */
export function updatePolygonOverlays(self, clusters = []) {
  const overlays = self.leaflet?.polygonGeoJSON;
  if (!overlays || typeof overlays.eachLayer !== "function") {
    return;
  }
  const clustered = new Set();
  clusters.forEach((cluster) => {
    cluster.childNodes.forEach((node) => {
      if (isPolygon(node)) {
        // eslint-disable-next-line no-underscore-dangle
        clustered.add(self.originalGeoJSON.features[node.properties._featureIndex]);
      }
    });
  });
  let readded = false;
  overlays.eachLayer((layer) => {
    if (clustered.has(layer.feature)) {
      self.leaflet.removeLayer(layer);
    } else if (!self.leaflet.hasLayer(layer)) {
      self.leaflet.addLayer(layer);
      readded = true;
    }
  });
  if (readded) {
    // A re-added layer is drawn on top, so restore the order of the features
    overlays.eachLayer((layer) => {
      if (self.leaflet.hasLayer(layer)) {
        layer.bringToFront();
      }
    });
  }
}
