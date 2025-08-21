/* eslint-disable no-underscore-dangle */
/**
 * extend echarts view
 * @param {object} echarts
 * @param {object} L
 */
export default function extendLeafletView(echarts, L) {
  echarts.extendComponentView({
    type: "leaflet",

    render(leafletModel, ecModel, api) {
      let rendering = true;

      const leaflet = leafletModel.getLeaflet();
      const moveContainer = api.getZr().painter.getViewportRoot().parentNode;
      const coordSys = leafletModel.coordinateSystem;

      const {roam} = leafletModel.get("mapOptions");
      // can move
      if (roam && roam !== "scale") {
        leaflet.dragging.enable();
      } else {
        leaflet.dragging.disable();
      }
      // can zoom (may need to be more fine-grained)
      if (roam && roam !== "move") {
        leaflet.scrollWheelZoom.enable();
        leaflet.doubleClickZoom.enable();
        leaflet.touchZoom.enable();
      } else {
        leaflet.scrollWheelZoom.disable();
        leaflet.doubleClickZoom.disable();
        leaflet.touchZoom.disable();
      }

      /**
       * handler for map move event.
       */
      function moveHandler(e) {
        if (rendering) {
          return;
        }

        // Compute offset using Leaflet's DOM util to avoid rounding errors
        // and account for transform/scale during zoom animations.
        const panePos = L.DomUtil.getPosition(leaflet._mapPane) || {x: 0, y: 0};
        let mapOffset = [-panePos.x, -panePos.y];
        moveContainer.style.left = `${mapOffset[0]}px`;
        moveContainer.style.top = `${mapOffset[1]}px`;

        coordSys.setMapOffset(mapOffset);
        leafletModel.__mapOffset = mapOffset;
        const actionParams = {
          type: "leafletRoam",
          animation: {
            duration: 0,
          },
        };
        api.dispatchAction(actionParams);
      }

      /**
       * handler for map zoom event
       */
      function zoomEndHandler() {
        if (rendering) {
          return;
        }
        
        api.dispatchAction({
          type: "leafletRoam",
        });
      }

      function zoomHandler() {
        moveHandler();
      }

      /**
       * handler for map resize event
       */
      function resizeHandler() {
        echarts.getInstanceByDom(api.getDom()).resize();
      }

      if (this._oldMoveHandler) {
        leaflet.off("move", this._oldMoveHandler);
      }
      if (this._oldZoomHandler) {
        leaflet.off("zoom", this._oldZoomHandler);
      }
      if (this._oldZoomEndHandler) {
        leaflet.off("zoomend", this._oldZoomEndHandler);
      }
      if (this._oldResizeHandler) {
        leaflet.off("resize", this._oldResizeHandler);
      }

      leaflet.on("move", moveHandler);
      leaflet.on("zoom", zoomHandler);
      leaflet.on("zoomend", zoomEndHandler);
      leaflet.on("resize", resizeHandler);

      this._oldMoveHandler = moveHandler;
      this._oldZoomHandler = zoomHandler;
      this._oldZoomEndHandler = zoomEndHandler;
      this._oldResizeHandler = resizeHandler;

      rendering = false;
    },
  });
}
