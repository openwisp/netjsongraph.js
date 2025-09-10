import {registerCoordinateSystem, registerAction} from "echarts/core";
import createLeafletCoordSystem from "./LeafletCoordSys";
import extendLeafletModel from "./LeafletModel";
import extendLeafletView from "./LeafletView";

/**
 * echarts register leaflet coord system
 */
export function registerLeafletSystem() {
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
