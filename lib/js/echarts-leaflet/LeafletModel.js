/**
 * extend echarts model
 * @param {object} echarts
 */
export default function extendLeafletModel(echarts) {
  /**
   * compare if two arrays of length 2 are equal
   * @param {Array} a array of length 2
   * @param {Array} b array of length 2
   * @return {Boolean}
   */
  function v2Equal(a, b) {
    return a && b && a[0] === b[0] && a[1] === b[1];
  }

  echarts.extendComponentModel({
    type: 'leaflet',

    getLeaflet: function() {
      // __map is injected when creating LeafletCoordSys
      return this.__map;
    },

    setCenterAndZoom: function(center, zoom) {
      this.option.center = center;
      this.option.zoom = zoom;
    },

    centerOrZoomChanged: function(center, zoom) {
      const option = this.option;
      return !(v2Equal(center, option.center) && zoom === option.zoom);
    },

    defaultOption: {
      mapOptions: {},
      tiles: [
        {
          urlTemplate: 'http://{s}.tile.osm.org/{z}/{x}/{y}.png',
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
