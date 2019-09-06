/**
 * extend echarts view
 * @param {object} echarts
 * @param {object} L
 */
export default function extendLeafletView(echarts, L) {
  echarts.extendComponentView({
    type: 'leaflet',

    render(leafletModel, ecModel, api) {
      let rendering = true;

      const leaflet = leafletModel.getLeaflet();
      const moveContainer = api.getZr().painter.getViewportRoot().parentNode;
      const coordSys = leafletModel.coordinateSystem;
      const _preMapStatus = { x: 0, y: 0 };

      if (this._oldMoveStartHandler) {
        leaflet.off('movestart', this._oldMoveStartHandler);
      }
      if (this._oldMoveHandler) {
        leaflet.off('move', this._oldMoveHandler);
      }
      if (this._oldZoomEndHandler) {
        leaflet.off('zoomend', this._oldZoomEndHandler);
      }
      if (this._oldResizeHandler) {
        leaflet.off('resize', this._oldResizeHandler);
      }


      leaflet.on('movestart', setPosition);
      leaflet.on('move', moveHandler);
      leaflet.on('zoomend', zoomHandler);
      leaflet.on('resize', resizeHandler);

      this._oldMoveStartHandler = setPosition;
      this._oldMoveHandler = moveHandler;
      this._oldZoomEndHandler = zoomHandler;
      this._oldResizeHandler = resizeHandler;

      const { roam } = leafletModel.get('mapOptions');
      // can move
      if (roam && roam !== 'scale') {
        leaflet.dragging.enable();
      } else {
        leaflet.dragging.disable();
      }
      // can zoom (may need to be more fine-grained)
      if (roam && roam !== 'move') {
        leaflet.scrollWheelZoom.enable();
        leaflet.doubleClickZoom.enable();
        leaflet.touchZoom.enable();
      } else {
        leaflet.scrollWheelZoom.disable();
        leaflet.doubleClickZoom.disable();
        leaflet.touchZoom.disable();
      }

      /**
       * init position status at move start.
       */
      function setPosition() {
        if (rendering) {
          return;
        }

        const pos = getMapOffset(leaflet);
        if (pos) {
          Object.assign(_preMapStatus, { x: pos.x, y: pos.y });
        }
      }

      /**
       * handler for map move event.
       */
      function moveHandler() {
        if (rendering) {
          return;
        }

        const offset = setOffset();
        if (offset) {
          const { dx, dy } = offset;
          api.dispatchAction({
            type: 'leafletMove',
            dx, dy,
          });
        }
      };

      /**
       * handler for map zoom event
       */
      function zoomHandler() {
        if (rendering) {
          return;
        }

        api.dispatchAction({
          type: 'leafletZoom',
        });
      }

      /**
       * handler for map resize event
       */
      function resizeHandler() {
        const _ecDom = api.getDom();
        inheritDomSize(moveContainer, _ecDom);

        resizeAllChildren(moveContainer);

        api.dispatchAction({
          type: 'leafletZoom',
        });
      }

      /**
       * get leaflet map offset
       * 
       * @param {object} map leaflet map
       * @return {object|undefined} { x, y }
       */
      function getMapOffset(map) {
        const pos = L.DomUtil.getPosition(map.getPanes().mapPane);
        if (!pos) {
          console.error("Can't get the map offset!");
          return;
        }
        return pos;
      }

      /**
       * set canvas container's offset according to leaflet map offset.
       * @return {object|undefined} { dx, dy }
       */
      function setOffset() {
        const pos = getMapOffset(leaflet);
        if (pos) {
          const { x, y } = pos,
            dx = x - _preMapStatus.x,
            dy = y - _preMapStatus.y;

          Object.assign(_preMapStatus, { x, y });
          
          L.DomUtil.setPosition(moveContainer, { x: -x, y: -y });

          coordSys.setMapOffset([-x, -y]);
          leafletModel.__mapOffset = [-x, -y];

          return { dx, dy };
        }
        
      }

      /**
       * resize dom's all children.
       */
      function resizeAllChildren(root) {
        const children = [...root.childNodes];

        children.map(childDom => {
          inheritDomSize(childDom, root);
          if(childDom.childNodes.length){
            resizeAllChildren(childDom);
          }
        })
      }

      /**
       * resize the child of parent, canvas specially.
       */
      function inheritDomSize(child, parent) {
        const parentSize = [parseFloat(getComputedStyle(parent).width), parseFloat(getComputedStyle(parent).height)];
        
        if(isCanvas(child)){
          child.width = child.width / parseFloat(getComputedStyle(child).width) * parentSize[0];
          child.height = child.height / parseFloat(getComputedStyle(child).height) * parentSize[1];
        }

        child.style.width = `${parentSize[0]}px`;
        child.style.height = `${parentSize[1]}px`;
      }

      /**
       * Dom is canvas ?
       */
      function isCanvas(dom){
        return dom.tagName === "CANVAS";
      }

      rendering = false;
    },
  });
}
