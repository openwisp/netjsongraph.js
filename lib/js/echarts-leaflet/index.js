import createLeafletCoordSystem from './LeafletCoordSys';
import extendLeafletModel from './LeafletModel';
import extendLeafletView from './LeafletView';

const colorTool = require("zrender/lib/tool/color");
const aria = require("echarts/lib/visual/aria");
const { each } = require("zrender/lib/core/util");
const env = require("zrender/lib/core/env");

/**
 * echarts register leaflet coord system
 * @param {object} echarts
 * @param {object} L
 */
function registerLeafletSystem(echarts, L) {
  extendLeafletModel(echarts);
  extendLeafletView(echarts, L);

  echarts.registerCoordinateSystem('leaflet', createLeafletCoordSystem(echarts, L));
  
  echarts.registerAction({
    type: 'leafletMove',
    event: 'leafletMove',
    update: 'none'
  }, function (payload, ecModel) {
    const ec = ecModel.scheduler.ecInstance;
    ec._chartsViews.map(({group}) => {
      updateViewOnPan({
        target: group
      }, payload.dx, payload.dy);
    }) 

    ecModel.eachComponent('leaflet', function (leafletModel) {
      var leaflet = leafletModel.getLeaflet();
      var center = leaflet.getCenter();
      leafletModel.setCenterAndZoom([center.lng, center.lat], leaflet.getZoom());
    });
  });
  echarts.registerAction({
    type: 'leafletZoom',
    event: 'leafletZoom',
    update: 'none',
  }, function (payload, ecModel) {
    const ec = ecModel.scheduler.ecInstance;

    update.call(ec, payload);

    // set position offset to [0, 0]
    ec._chartsViews.map(({group}) => {
      updateViewOnPan({
        target: group
      }, -group.position[0], -group.position[1]);
    }) 

    ecModel.eachComponent('leaflet', function (leafletModel) {
      var leaflet = leafletModel.getLeaflet();
      var center = leaflet.getCenter();
      leafletModel.setCenterAndZoom([center.lng, center.lat], leaflet.getZoom());
    });
  });
  echarts.registerAction({
    type: 'leafletResize',
    event: 'leafletResize',
    update: 'none'
  }, function (payload, ecModel) {
    ecModel.eachComponent('leaflet', function (leafletModel) {
      var leaflet = leafletModel.getLeaflet();
      var center = leaflet.getCenter();
      leafletModel.setCenterAndZoom([center.lng, center.lat], leaflet.getZoom());
    });
  });
}

/**
 * For geo and graph.
 *
 * @param {Object} controllerHost
 * @param {module:zrender/Element} controllerHost.target
 */
function updateViewOnPan(controllerHost, dx, dy) {
  var target = controllerHost.target;
  var pos = target.position;
  pos[0] += dx;
  pos[1] += dy;
  (function dirty(target) {
    target.__dirty = true;
    target.__zr && target.__zr.refreshImmediately();
  })(target)
}

/**
 * @param {Object} payload
 * @private
 */
function update(payload) {
  // console.profile && console.profile('update');
  var ecModel = this._model;
  var api = this._api;
  var zr = this._zr;
  var coordSysMgr = this._coordSysMgr;
  var scheduler = this._scheduler; // update before setOption

  if (!ecModel) {
    return;
  }

  scheduler.restoreData(ecModel, payload);
  scheduler.performSeriesTasks(ecModel); // TODO
  // Save total ecModel here for undo/redo (after restoring data and before processing data).
  // Undo (restoration of total ecModel) can be carried out in 'action' or outside API call.
  // Create new coordinate system each update
  // In LineView may save the old coordinate system and use it to get the orignal point

  coordSysMgr.create(ecModel, api);
  scheduler.performDataProcessorTasks(ecModel, payload); // Current stream render is not supported in data process. So we can update
  // stream modes after data processing, where the filtered data is used to
  // deteming whether use progressive rendering.

  updateStreamModes(this, ecModel); // We update stream modes before coordinate system updated, then the modes info
  // can be fetched when coord sys updating (consider the barGrid extent fix). But
  // the drawback is the full coord info can not be fetched. Fortunately this full
  // coord is not requied in stream mode updater currently.

  coordSysMgr.update(ecModel, api);
  clearColorPalette(ecModel);
  scheduler.performVisualTasks(ecModel, payload);
  render(this, ecModel, api, payload); // Set background

  zr.refreshImmediately();

  var backgroundColor = ecModel.get('backgroundColor') || 'transparent'; // In IE8

  if (!env.canvasSupported) {
    var colorArr = colorTool.parse(backgroundColor);
    backgroundColor = colorTool.stringify(colorArr, 'rgb');

    if (colorArr[3] === 0) {
      backgroundColor = 'transparent';
    }
  } else {
    zr.setBackgroundColor(backgroundColor);
  }

  // performPostUpdateFuncs(ecModel, api); // console.profile && console.profileEnd('update');

  // function performPostUpdateFuncs(ecModel, api) {
  //   each(postUpdateFuncs, function (func) {
  //     func(ecModel, api);
  //   });
  // }

  function updateStreamModes(ecIns, ecModel) {
    var chartsMap = ecIns._chartsMap;
    var scheduler = ecIns._scheduler;
    ecModel.eachSeries(function (seriesModel) {
      scheduler.updateStreamModes(seriesModel, chartsMap[seriesModel.__viewId]);
    });
  }

  function clearColorPalette(ecModel) {
    ecModel.clearColorPalette();
    ecModel.eachSeries(function (seriesModel) {
      seriesModel.clearColorPalette();
    });
  }

  function render(ecIns, ecModel, api, payload) {
    renderComponents(ecIns, ecModel, api, payload);
    each(ecIns._chartsViews, function (chart) {
      chart.__alive = false;
    });
    renderSeries(ecIns, ecModel, api, payload); // Remove groups of unrendered charts
  
    each(ecIns._chartsViews, function (chart) {
      if (!chart.__alive) {
        chart.remove(ecModel, api);
      }
    });
  }
  
  function renderComponents(ecIns, ecModel, api, payload, dirtyList) {
    each(dirtyList || ecIns._componentsViews, function (componentView) {
      var componentModel = componentView.__model;
      componentView.render(componentModel, ecModel, api, payload);
      updateZ(componentModel, componentView);
    });
  }
  
  /**
   * Render each chart and component
   * @private
   */
  function renderSeries(ecIns, ecModel, api, payload, dirtyMap) {
    // Render all charts
    var scheduler = ecIns._scheduler;
    var unfinished;
    ecModel.eachSeries(function (seriesModel) {
      var chartView = ecIns._chartsMap[seriesModel.__viewId];
      chartView.__alive = true;
      var renderTask = chartView.renderTask;
      scheduler.updatePayload(renderTask, payload);
  
      if (dirtyMap && dirtyMap.get(seriesModel.uid)) {
        renderTask.dirty();
      }
  
      unfinished |= renderTask.perform(scheduler.getPerformArgs(renderTask));
      chartView.group.silent = !!seriesModel.get('silent');
      updateZ(seriesModel, chartView);
      updateBlend(seriesModel, chartView);
    });
    scheduler.unfinished |= unfinished; // If use hover layer
  
    updateHoverLayerStatus(ecIns._zr, ecModel); // Add aria
  
    aria(ecIns._zr.dom, ecModel);
  }

  /**
   * @param {module:echarts/model/Series|module:echarts/model/Component} model
   * @param {module:echarts/view/Component|module:echarts/view/Chart} view
   */
  function updateZ(model, view) {
    var z = model.get('z');
    var zlevel = model.get('zlevel'); // Set z and zlevel

    view.group.traverse(function (el) {
      if (el.type !== 'group') {
        z != null && (el.z = z);
        zlevel != null && (el.zlevel = zlevel);
      }
    });
  }

  /**
   * Update chart progressive and blend.
   * @param {module:echarts/model/Series|module:echarts/model/Component} model
   * @param {module:echarts/view/Component|module:echarts/view/Chart} view
   */
  function updateBlend(seriesModel, chartView) {
    var blendMode = seriesModel.get('blendMode') || null;
    chartView.group.traverse(function (el) {
      // FIXME marker and other components
      if (!el.isGroup) {
        // Only set if blendMode is changed. In case element is incremental and don't wan't to rerender.
        if (el.style.blend !== blendMode) {
          el.setStyle('blend', blendMode);
        }
      }

      if (el.eachPendingDisplayable) {
        el.eachPendingDisplayable(function (displayable) {
          displayable.setStyle('blend', blendMode);
        });
      }
    });
  }

  function updateHoverLayerStatus(zr, ecModel) {
    var storage = zr.storage;
    var elCount = 0;
    storage.traverse(function (el) {
      if (!el.isGroup) {
        elCount++;
      }
    });
  
    if (elCount > ecModel.get('hoverLayerThreshold') && !env.node) {
      storage.traverse(function (el) {
        if (!el.isGroup) {
          // Don't switch back.
          el.useHoverLayer = true;
        }
      });
    }
  }
}

registerLeafletSystem.version = '1.0.0';

export default registerLeafletSystem;
