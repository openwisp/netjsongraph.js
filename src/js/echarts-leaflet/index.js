import {registerCoordinateSystem, registerAction} from "echarts/core";
import createLeafletCoordSystem from "./LeafletCoordSys";
import extendLeafletModel from "./LeafletModel";
import extendLeafletView from "./LeafletView";
import getLeaflet from "../leaflet-loader";

/**
 * echarts register leaflet coord system
 */
export function registerLeafletSystem() {
  const L = getLeaflet(true);
  if (!L) {
    // Leaflet is not available, so we can't register the Leaflet coordinate system.
    // This is fine for graph-only rendering.
    return;
  }

  extendLeafletModel();
  extendLeafletView();

  registerCoordinateSystem("leaflet", createLeafletCoordSystem());

  registerAction(
    {
      type: "leafletRoam",
      event: "leafletRoam",
      update: "updateLayout",
    },
    (payload, ecModel) => {
      ecModel.eachComponent("leaflet", (leafletModel) => {
        const leaflet = leafletModel.getLeaflet();
        const center = leaflet.getCenter();
        leafletModel.setCenterAndZoom([center.lng, center.lat], leaflet.getZoom());
      });
    },
  );
}

registerLeafletSystem.version = "1.0.0";

export default registerLeafletSystem;
