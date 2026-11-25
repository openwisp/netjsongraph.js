/* eslint-disable no-underscore-dangle */
import {graphic} from "echarts/core";
import NetJSONGraphRender from "../src/js/netjsongraph.render";

const {BoundingRect} = graphic;

describe("initial graph fitting", () => {
  let render;
  let self;
  let series;
  let view;
  let events;
  let pointerEvents;
  let positions;
  let transform;
  let zoom;
  let limit;

  beforeEach(() => {
    render = new NetJSONGraphRender();
    events = new Map();
    pointerEvents = new Map();
    positions = [
      [100, 100],
      [400, 300],
    ];
    transform = [1, 0, 0, 1, 0, 0];
    zoom = 1;
    limit = {};
    view = {_layouting: true};
    const data = {
      count: () => positions.length,
      eachItemGraphicEl: (callback) =>
        positions.forEach(([x, y]) =>
          callback({
            getBoundingRect: () => new BoundingRect(x - 10, y - 10, 20, 20),
            getComputedTransform: () => transform,
            getTextContent: () => null,
          }),
        ),
    };
    series = {
      id: "network-graph",
      get: (name) => ({layout: "force", zoom, scaleLimit: limit})[name],
      getData: () => data,
      getEdgeData: () => ({eachItemGraphicEl: () => {}}),
    };
    self = {
      config: {autoFitGraph: true, graphConfig: {series: {}}},
      echarts: {
        on: (name, callback) => events.set(name, callback),
        off: (name) => events.delete(name),
        getZr: () => ({
          on: (name, callback) => pointerEvents.set(name, callback),
          off: (name) => pointerEvents.delete(name),
        }),
        getModel: () => ({getSeriesByIndex: () => series}),
        getViewOfSeriesModel: () => view,
        getWidth: () => 900,
        getHeight: () => 600,
        dispatchAction: jest.fn((action) => {
          if (action.zoom) {
            zoom *= action.zoom;
            transform = [
              transform[0] * action.zoom,
              0,
              0,
              transform[3] * action.zoom,
              action.originX + (transform[4] - action.originX) * action.zoom,
              action.originY + (transform[5] - action.originY) * action.zoom,
            ];
          } else {
            transform[4] += action.dx;
            transform[5] += action.dy;
          }
        }),
      },
    };
  });

  test("waits for force layout completion and fits only once", () => {
    render.setupGraphFit(self);
    const finished = events.get("finished");
    finished();
    expect(self.echarts.dispatchAction).not.toHaveBeenCalled();
    view._layouting = false;
    finished();
    expect(zoom).toBeGreaterThan(1);
    expect(self.graphFitted).toBe(true);
    expect(events.size).toBe(0);
    expect(pointerEvents.size).toBe(0);
    render.setupGraphFit(self);
    expect(events.size).toBe(0);
  });

  test("warns once and removes pending handlers if the layout flag is unavailable", () => {
    const warning = jest.spyOn(console, "warn").mockImplementation(() => {});
    delete view._layouting;
    try {
      render.setupGraphFit(self);
      events.get("finished")();
      render.setupGraphFit(self);
      expect(warning).toHaveBeenCalledTimes(1);
      expect(warning).toHaveBeenCalledWith(expect.stringContaining("autoFitGraph"));
      expect(events.size).toBe(0);
      expect(pointerEvents.size).toBe(0);
      expect(self.echarts.dispatchAction).not.toHaveBeenCalled();
    } finally {
      warning.mockRestore();
    }
  });

  test("restoring the graph starts another fit after manual interaction", () => {
    self.el = document.createElement("div");
    self.event = {emit: jest.fn()};
    self.utils = {
      setupGraphFit: render.setupGraphFit.bind(render),
      generateGraphOption: jest.fn(),
      echartsSetOption: jest.fn(),
      _propagateGraphZoom: jest.fn(),
      setupHashChangeHandler: jest.fn(),
    };
    render.graphRender({nodes: [], links: []}, self);
    pointerEvents.get("mousedown")();
    expect(self.graphFitted).toBe(true);
    expect(events.has("finished")).toBe(false);
    expect(events.has("restore")).toBe(true);
    events.get("restore")();
    expect(self.graphFitted).toBe(false);
    view._layouting = false;
    events.get("finished")();
    expect(zoom).toBeGreaterThan(1);
    expect(self.graphFitted).toBe(true);
    expect([...events.keys()]).toEqual(["restore"]);
    const previousRestore = self.restoreGraphFit;
    const off = jest.spyOn(self.echarts, "off");
    render.graphRender({nodes: [], links: []}, self);
    expect(off).toHaveBeenCalledWith("restore", previousRestore);
    expect([...events.keys()]).toEqual(["restore"]);
  });

  test.each(["graphRoam", "mousedown"])(
    "preserves interaction before fitting: %s",
    (event) => {
      render.setupGraphFit(self);
      (events.get(event) || pointerEvents.get(event))();
      view._layouting = false;
      render.setupGraphFit(self);
      expect(self.graphFitted).toBe(true);
      expect(events.size).toBe(0);
      expect(pointerEvents.size).toBe(0);
      expect(self.echarts.dispatchAction).not.toHaveBeenCalled();
    },
  );

  test.each(["disabled", "zoom", "center"])(
    "respects configured view: %s",
    (setting) => {
      if (setting === "disabled") {
        self.config.autoFitGraph = false;
      } else {
        self.config.graphConfig.series[setting] = setting === "zoom" ? 2 : [0, 0];
      }
      render.setupGraphFit(self);
      expect(events.size).toBe(0);
    },
  );

  test("replaces pending listeners and cancels when the graph is removed", () => {
    render.setupGraphFit(self);
    const previous = events.get("finished");
    render.setupGraphFit(self);
    expect(events.get("finished")).not.toBe(previous);
    series.id = "geo-map";
    events.get("finished")();
    expect(events.size).toBe(0);
    expect(pointerEvents.size).toBe(0);
    expect(self.echarts.dispatchAction).not.toHaveBeenCalled();
  });

  test.each([1, 10])("fits and centres graph bounds at size %s", (size) => {
    positions = positions.map(([x, y]) => [x * size, y * size]);
    render.fitGraph(self, series);
    const bounds = render.getGraphBounds(series);
    expect(bounds.x).toBeGreaterThanOrEqual(39.9);
    expect(bounds.y).toBeGreaterThanOrEqual(39.9);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(860.1);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(560.1);
    expect(bounds.x + bounds.width / 2).toBeCloseTo(450);
    expect(bounds.y + bounds.height / 2).toBeCloseTo(300);
    expect(size === 1 ? zoom > 1 : zoom < 1).toBe(true);
  });

  test("centres one node without magnifying it", () => {
    positions = [[100, 100]];
    render.fitGraph(self, series);
    const bounds = render.getGraphBounds(series);
    expect(zoom).toBe(1);
    expect(bounds.x + bounds.width / 2).toBeCloseTo(450);
    expect(bounds.y + bounds.height / 2).toBeCloseTo(300);
  });

  test.each([{max: 1.5}, {min: 3}])("honours zoom limits: %j", (limits) => {
    limit = limits;
    render.fitGraph(self, series);
    expect(zoom).toBe(limits.max || limits.min);
  });

  test("waits for nonempty data and a visible container", () => {
    positions = [];
    view._layouting = false;
    render.setupGraphFit(self);
    events.get("finished")();
    expect(self.graphFitted).toBeUndefined();
    positions = [[100, 100]];
    self.echarts.getWidth = () => 0;
    events.get("finished")();
    expect(self.echarts.dispatchAction).not.toHaveBeenCalled();
    self.echarts.getWidth = () => 900;
    events.get("finished")();
    expect(self.graphFitted).toBe(true);
  });

  test("includes transformed symbols, visible labels and curved links", () => {
    const element = (rect, ignore = false) => ({
      ignore,
      getBoundingRect: () => rect,
      getComputedTransform: () => [2, 0, 0, 2, 10, 20],
      getTextContent: () => null,
    });
    const node = element(new BoundingRect(0, 0, 20, 20));
    node.getTextContent = () => element(new BoundingRect(-20, -10, 60, 10));
    const group = {
      isGroup: true,
      eachChild: (fn) => fn(node),
      getTextContent: () => null,
    };
    series.getData = () => ({eachItemGraphicEl: (fn) => fn(group)});
    series.getEdgeData = () => ({
      eachItemGraphicEl: (fn) => {
        fn(element(new BoundingRect(10, 10, 60, 40)));
        fn(element(new BoundingRect(-1000, -1000, 1, 1), true));
      },
    });
    const bounds = render.getGraphBounds(series);
    expect([bounds.x, bounds.y, bounds.width, bounds.height]).toEqual([
      -30, 0, 180, 120,
    ]);
  });
});
