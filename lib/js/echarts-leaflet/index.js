import createLeafletCoordSystem from "./LeafletCoordSys";
import extendLeafletModel from "./LeafletModel";
import extendLeafletView from "./LeafletView";

/**
 * echarts register leaflet coord system
 * @param {object} echarts
 * @param {object} L
 * @param {object} API {
 *   colorTool: "zrender/lib/tool/color",
 *   { each }: "zrender/lib/core/util",
 *   env: "zrender/lib/core/env",
 * }
 */
function registerLeafletSystem(echarts, L, API) {
  extendLeafletModel(echarts);
  extendLeafletView(echarts, L);

  echarts.registerCoordinateSystem(
    "leaflet",
    createLeafletCoordSystem(echarts, L),
  );

  echarts.registerAction(
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
