import { extendComponentModel } from "echarts/core";

/**
 * extend echarts model
 */
export default function extendLeafletModel() {
  /**
   * compare if two arrays of length 2 are equal
   * @param {Array} a array of length 2
   * @param {Array} b array of length 2
   * @return {Boolean}
   */
  function v2Equal(a, b) {
    return a && b && a[0] === b[0] && a[1] === b[1];
  }

  extendComponentModel({
    type: "leaflet",

    getLeaflet() {
      // __map is injected when creating LeafletCoordSys
      // eslint-disable-next-line no-underscore-dangle
      return this.__map;
    },

    setCenterAndZoom(center, zoom) {
      this.option.center = center;
      this.option.zoom = zoom;
    },

    centerOrZoomChanged(center, zoom) {
      const {option} = this;
      return !(v2Equal(center, option.center) && zoom === option.zoom);
    },

    defaultOption: {
      mapOptions: {},
      tiles: [
        {
          urlTemplate: "http://{s}.tile.osm.org/{z}/{x}/{y}.png",
          options: {
            attribution:
              '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors',
          },
        },
      ],
      layerControl: {},
    },
  });
}
