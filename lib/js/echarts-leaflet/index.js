import createLeafletCoordSystem from "./LeafletCoordSys";
import extendLeafletModel from "./LeafletModel";
import extendLeafletView from "./LeafletView";
import {registerCoordinateSystem, registerAction} from "echarts/core";

/**
 * echarts register leaflet coord system
 * @param {object} L
 * @param {object} API {
 *   colorTool: "zrender/lib/tool/color",
 *   { each }: "zrender/lib/core/util",
 *   env: "zrender/lib/core/env",
 * }
 */
function registerLeafletSystem(L, API) {
  extendLeafletModel();
  extendLeafletView(L);

  registerCoordinateSystem(
    "leaflet",
    createLeafletCoordSystem(L),
  );

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
        leafletModel.setCenterAndZoom(
          [center.lng, center.lat],
          leaflet.getZoom(),
        );
      });
    },
  );
}

registerLeafletSystem.version = "1.0.0";

export default registerLeafletSystem;
