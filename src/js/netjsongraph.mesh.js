/*
 * Dedicated Mesh → NetJSON utilities for netjsongraph.js
 */

/**
 * Detects if the input object is a Mesh data structure keyed by device MACs
 * mapping to arrays of interface objects which may contain a `wireless` block.
 *
 * Note: relies on `this.isObject` from the NetJSONGraphUtil instance.
 */
export function isMeshData(param) {
  if (!this.isObject(param)) return false;
  // If it's already NetJSON or GeoJSON, it's not mesh data
  if (param && (param.nodes || param.links || param.type)) return false;

  const isMac = (s) =>
    typeof s === "string" && /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(s);

  const keys = Object.keys(param || {});
  if (!keys.length) return false;

  // Heuristic: at least one MAC-like key mapping to an array of interface-like objects
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    const val = param[key];
    if (isMac(key) && Array.isArray(val)) {
      if (
        val.some(
          (it) =>
            it &&
            (it.type === "wireless" ||
              (it.wireless && this.isObject(it.wireless))),
        )
      ) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Converts Mesh data (MAC -> [interfaces]) into NetJSON {nodes, links}.
 * - Node id: device MAC (top-level key)
 * - Node label: device MAC (fallback or interface name if available)
 * - Node properties: aggregates some wireless info; sets clients_wifi count
 * - Links: for each wireless.clients entry whose MAC matches any interface MAC of
 *          another device, creates an undirected link.
 *
 * Note: relies on `this.isObject` and `this.isMeshData` from NetJSONGraphUtil.
 */
export function meshToNetjson(mesh) {
  if (!this.isMeshData(mesh)) return mesh;

  const normalizeMac = (s) => (typeof s === "string" ? s.toLowerCase() : s);

  const interfaceMacToDevice = new Map();
  const nodes = [];
  const links = [];

  // First pass: map every interface MAC to its parent device
  Object.keys(mesh).forEach((deviceId) => {
    const ifaces = mesh[deviceId] || [];
    ifaces.forEach((iface) => {
      if (iface && iface.mac) {
        interfaceMacToDevice.set(normalizeMac(iface.mac), deviceId);
      }
    });
  });

  // Helper to aggregate wireless data for a device
  const aggregateWireless = (ifaces) => {
    let clientsWifi = 0;
    const summary = {
      channels: new Set(),
      ssids: new Set(),
      modes: new Set(),
      countries: new Set(),
    };
    ifaces.forEach((iface) => {
      if (iface && iface.wireless && this.isObject(iface.wireless)) {
        const w = iface.wireless;
        if (Array.isArray(w.clients)) clientsWifi += w.clients.length;
        if (w.channel !== undefined && w.channel !== null)
          summary.channels.add(String(w.channel));
        if (w.ssid) summary.ssids.add(String(w.ssid));
        if (w.mode) summary.modes.add(String(w.mode));
        if (w.country) summary.countries.add(String(w.country));
      }
    });
    return {
      clients_wifi: clientsWifi,
      channels: Array.from(summary.channels),
      ssids: Array.from(summary.ssids),
      modes: Array.from(summary.modes),
      countries: Array.from(summary.countries),
    };
  };

  // Second pass: build nodes
  Object.keys(mesh).forEach((deviceId) => {
    const ifaces = mesh[deviceId] || [];
    const agg = aggregateWireless(ifaces);

    // Try to find a meaningful name from interfaces, fallback to device ID
    let nodeName = deviceId;
    if (ifaces.length > 0) {
      const namedIface = ifaces.find(
        (iface) => iface.name && typeof iface.name === "string",
      );
      if (namedIface) {
        nodeName = namedIface.name;
      }
    }

    const node = {
      id: deviceId,
      label: nodeName,
      properties: {
        clients_wifi: agg.clients_wifi,
        wireless_channels: agg.channels,
        wireless_ssids: agg.ssids,
        wireless_modes: agg.modes,
        wireless_countries: agg.countries,
      },
    };
    nodes.push(node);
  });

  // Third pass: create links by matching client MACs to known interface MACs
  const seen = new Set();
  Object.keys(mesh).forEach((deviceId) => {
    const ifaces = mesh[deviceId] || [];
    ifaces.forEach((iface) => {
      const w = iface && iface.wireless;
      if (!w || !Array.isArray(w.clients)) return;
      w.clients.forEach((client) => {
        const mac = client && client.mac ? normalizeMac(client.mac) : null;
        if (!mac) return;
        const otherDevice = interfaceMacToDevice.get(mac);
        if (!otherDevice || otherDevice === deviceId) return;
        const a = deviceId;
        const b = otherDevice;
        const key = a < b ? `${a}|${b}` : `${b}|${a}`;
        if (seen.has(key)) return;
        seen.add(key);
        const link = {
          source: a,
          target: b,
          properties: {},
        };
        // Attach any useful link metrics if present
        ["signal", "noise", "mesh_plink", "mesh_non_peer_ps"].forEach((p) => {
          if (client[p] !== undefined && client[p] !== null)
            link.properties[p] = client[p];
        });
        links.push(link);
      });
    });
  });

  return {
    label: "Mesh Network",
    nodes,
    links,
  };
}
