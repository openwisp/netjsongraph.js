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
    type: "leaflet",

    getLeaflet() {
      // __map is injected when creating LeafletCoordSys
      // eslint-disable-next-line no-underscore-dangle
      return this.__map;
    },

    setCenterAndZoom(center, zoom) {
       // Limit zoom level before setting
       const maxZoom = this.option.mapOptions.maxZoom || this.getMaxZoom();
       zoom = Math.min(zoom, maxZoom);
       // If a zoom control exists, adjust its options
       const map = this.getLeaflet();
       if (map.zoomControl) {
         map.zoomControl.options.maxZoom = maxZoom;
       }
    
      this.option.center = center;
      this.option.zoom = zoom;
    },

    centerOrZoomChanged(center, zoom) {
      const {option} = this;
      return !(v2Equal(center, option.center) && zoom === option.zoom);
    },

    defaultOption: {
      mapOptions: {
        zoomDelta: 0.25, // Set zoom sensitivity
        zoomSnap: 0.19,    // Disable zoom snapping
        maxZoom: 15 
      },
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
    /**
     * Get the maximum supported zoom level
     * @return {number}
     */
    getMaxZoom() {
      return this.option.maxZoom;
    },
  });
}
