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
  let animationFinished;

  beforeEach(() => {
    jest.useFakeTimers();
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
    animationFinished = true;
    view = {_layouting: true};
    const data = {
      count: () => positions.length,
      getName: (index) => String(index),
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
      getFormattedLabel: () => undefined,
      getEdgeData: () => ({eachItemGraphicEl: () => {}}),
    };
    self = {
      config: {autoFitGraph: true, graphConfig: {series: {}}},
      echarts: {
        isDisposed: () => false,
        getOption: () => ({}),
        on: (name, callback) => events.set(name, callback),
        off: (name) => events.delete(name),
        getZr: () => ({
          animation: {isFinished: () => animationFinished},
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

  afterEach(() => {
    if (self.cancelGraphFit) {
      self.cancelGraphFit();
    }
    jest.useRealTimers();
  });

  test("fits while the force layout is moving and throttles repeated frames", () => {
    const fit = jest.spyOn(render, "fitGraph");
    render.setupGraphFit(self);
    const rendered = events.get("rendered");
    expect(typeof rendered).toBe("function");
    rendered();
    rendered();
    jest.advanceTimersByTime(100);
    expect(zoom).toBeGreaterThan(1);
    expect(fit).toHaveBeenCalledTimes(1);
    expect(self.graphFitted).not.toBe(true);
    expect(events.has("rendered")).toBe(true);
    expect(pointerEvents.has("mousedown")).toBe(false);
    view._layouting = false;
    rendered();
    jest.advanceTimersByTime(100);
    expect(self.graphFitted).toBe(true);
    expect(events.size).toBe(0);
  });

  test("continues fitting until node size animations finish", () => {
    view._layouting = false;
    animationFinished = false;
    render.setupGraphFit(self);
    const rendered = events.get("rendered");
    rendered();
    jest.advanceTimersByTime(100);
    expect(zoom).toBeGreaterThan(1);
    expect(self.graphFitted).not.toBe(true);
    animationFinished = true;
    rendered();
    jest.advanceTimersByTime(100);
    expect(self.graphFitted).toBe(true);
  });

  test.each([undefined, null, 0, "running"])(
    "warns once when force layout completion has an unsupported value: %s",
    (value) => {
      const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
      const fit = jest.spyOn(render, "fitGraph");
      try {
        view._layouting = value;
        animationFinished = false;
        render.setupGraphFit(self);
        for (let frame = 0; frame < 2; frame += 1) {
          events.get("rendered")();
          jest.advanceTimersByTime(100);
        }
        render.setupGraphFit(self);
        events.get("rendered")();
        jest.advanceTimersByTime(100);
        expect(warn).toHaveBeenCalledTimes(1);
        expect(warn).toHaveBeenCalledWith(
          "autoFitGraph: cannot reliably detect force layout completion.",
        );
        expect(fit).toHaveBeenCalledTimes(3);
        view._layouting = false;
        animationFinished = true;
        events.get("rendered")();
        jest.advanceTimersByTime(100);
        expect(self.graphFitted).toBe(true);
        expect(events.size).toBe(0);
        expect(warn).toHaveBeenCalledTimes(1);
      } finally {
        warn.mockRestore();
        fit.mockRestore();
      }
    },
  );

  test.each([
    ["force", {_layouting: true}],
    ["force", {_layouting: false}],
    ["force", undefined],
    ["none", {}],
  ])("does not warn for layout %s with view %j", (layout, graphView) => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    const {get} = series;
    try {
      series.get = (name) => (name === "layout" ? layout : get(name));
      view = graphView;
      render.setupGraphFit(self);
      events.get("rendered")();
      jest.advanceTimersByTime(100);
      expect(warn).not.toHaveBeenCalled();
      expect(zoom).toBeGreaterThan(1);
      expect(self.graphFitted === true).toBe(!graphView?._layouting);
    } finally {
      warn.mockRestore();
    }
  });

  test("restoring the graph starts another fit after manual interaction", () => {
    self.el = document.createElement("div");
    self.event = {emit: jest.fn()};
    self.utils = {
      setupGraphFit: render.setupGraphFit.bind(render),
      generateGraphOption: jest.fn(() => ({series: [{}]})),
      echartsSetOption: jest.fn(),
      _propagateGraphZoom: jest.fn(),
      setupHashChangeHandler: jest.fn(),
    };
    render.graphRender({nodes: [], links: []}, self);
    events.get("graphRoam")();
    expect(self.graphFitted).toBe(true);
    expect(events.has("rendered")).toBe(false);
    expect(events.has("restore")).toBe(true);
    events.get("restore")();
    expect(self.graphFitted).toBe(false);
    view._layouting = false;
    events.get("rendered")();
    jest.advanceTimersByTime(100);
    expect(zoom).toBeGreaterThan(1);
    expect(self.graphFitted).toBe(true);
    expect([...events.keys()]).toEqual(["restore"]);
    const previousRestore = self.restoreGraphFit;
    const off = jest.spyOn(self.echarts, "off");
    render.graphRender({nodes: [], links: []}, self);
    expect(off).toHaveBeenCalledWith("restore", previousRestore);
    expect([...events.keys()]).toEqual(["restore", "rendered", "graphRoam"]);
  });

  test("preserves a user pan or zoom before layout completion", () => {
    render.setupGraphFit(self);
    events.get("rendered")();
    events.get("graphRoam")();
    jest.advanceTimersByTime(100);
    render.setupGraphFit(self);
    expect(self.graphFitted).toBe(true);
    expect(events.size).toBe(0);
    expect(self.echarts.dispatchAction).not.toHaveBeenCalled();
  });

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
    const previous = events.get("rendered");
    render.setupGraphFit(self);
    expect(events.get("rendered")).not.toBe(previous);
    series.id = "geo-map";
    events.get("rendered")();
    jest.advanceTimersByTime(100);
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
    events.get("rendered")();
    jest.advanceTimersByTime(100);
    expect(self.graphFitted).toBeUndefined();
    positions = [[100, 100]];
    self.echarts.getWidth = () => 0;
    events.get("rendered")();
    jest.advanceTimersByTime(100);
    expect(self.echarts.dispatchAction).not.toHaveBeenCalled();
    self.echarts.getWidth = () => 900;
    events.get("rendered")();
    jest.advanceTimersByTime(100);
    expect(self.graphFitted).toBe(true);
  });

  test.each([undefined, {zoom: 3, center: [50, 60]}])(
    "preserves the viewport while respecting explicit options: %j",
    (configured) => {
      const media = [{query: {minWidth: 501}, option: {series: [{zoom: 1}]}}];
      const option = {series: [{id: "network-graph", ...configured}], media};
      Object.assign(self.config.graphConfig.series, configured);
      const previous = {id: "network-graph", zoom: 2, center: [100, 200]};
      self.echarts.getOption = () => ({series: [previous]});
      self.graphFitted = true;
      self.el = document.createElement("div");
      self.event = {emit: jest.fn()};
      self.utils = {
        setupGraphFit: render.setupGraphFit.bind(render),
        generateGraphOption: () => option,
        echartsSetOption: jest.fn(),
        _propagateGraphZoom: jest.fn(),
        setupHashChangeHandler: jest.fn(),
      };
      render.graphRender({nodes: [], links: []}, self);
      const expected = configured || {zoom: 2, center: [100, 200]};
      expect(option.series[0]).toEqual({id: "network-graph", ...expected});
      expect(option.media[0].option.series[0]).toEqual(configured ? expected : {});
      expect(media[0].option.series[0]).toEqual({zoom: 1});
      expect(events.has("rendered")).toBe(false);
    },
  );

  test.each(
    [true, false].flatMap((autoFitGraph) =>
      [false, true].flatMap((updating) =>
        ["object", "array", "absent"].map((shape) => [autoFitGraph, updating, shape]),
      ),
    ),
  )(
    "handles media series with autoFitGraph=%s, updating=%s, shape=%s",
    (autoFitGraph, updating, shape) => {
      self.config.autoFitGraph = autoFitGraph;
      const style = {zoom: 0.7, center: [10, 20], label: {color: "red"}};
      const mediaSeries = shape === "array" ? [style] : style;
      const media = [
        {
          query: {maxWidth: 600},
          option: shape === "absent" ? {} : {series: mediaSeries},
        },
      ];
      const original = JSON.parse(JSON.stringify(media));
      const option = {series: [{id: "network-graph"}], media};
      const previous = {id: "network-graph", zoom: 2, center: [100, 200]};
      self.echarts.getOption = () => ({series: updating ? [previous] : []});
      self.graphFitted = updating;
      self.el = document.createElement("div");
      self.event = {emit: jest.fn()};
      self.utils = {
        setupGraphFit: render.setupGraphFit.bind(render),
        generateGraphOption: () => option,
        echartsSetOption: jest.fn(),
        _propagateGraphZoom: jest.fn(),
        setupHashChangeHandler: jest.fn(),
      };
      render.graphRender({nodes: [], links: []}, self);
      expect(self.utils.echartsSetOption).toHaveBeenCalledWith(option, self);
      expect(self.event.emit).toHaveBeenCalledWith("onLoad");
      expect(self.event.emit).toHaveBeenCalledWith("onReady");
      const result = option.media[0].option.series;
      if (autoFitGraph || updating) {
        const expected = autoFitGraph
          ? {label: style.label}
          : {...style, zoom: previous.zoom, center: previous.center};
        expect(result).toEqual(shape === "absent" ? [] : [expected]);
      } else {
        expect(result).toEqual(shape === "absent" ? undefined : mediaSeries);
      }
      expect(media).toEqual(original);
    },
  );

  test("cancels a scheduled fit when its chart has been disposed", () => {
    render.setupGraphFit(self);
    events.get("rendered")();
    self.echarts.isDisposed = () => true;
    jest.advanceTimersByTime(100);
    expect(self.echarts.dispatchAction).not.toHaveBeenCalled();
    expect(events.size).toBe(0);
    expect(self.cancelGraphFit).toBeNull();
  });

  test.each(["emphasis", "blur", "select"])(
    "keeps labels in sync when zooming into and out of the %s state",
    (state) => {
      const label = new graphic.Text({style: {text: "", fill: "black"}});
      label.ensureState(state).style = {text: "", fill: "red"};
      series.getData = () => ({
        getName: () => "First node",
        eachItemGraphicEl: (callback) =>
          callback({getSymbolPath: () => ({getTextContent: () => label})}, 0),
      });
      self.config.showGraphLabelsAtZoom = 2;
      zoom = 3;
      render.updateGraphLabels(self, series);
      expect(label.style.text).toBe("First node");
      label.useState(state, false, true);
      expect(label.style.text).toBe("First node");
      expect(label.style.fill).toBe("red");
      zoom = 1;
      render.updateGraphLabels(self, series);
      expect(label.currentStates).toEqual([state]);
      expect(label.style.text).toBe("");
      label.clearStates(true);
      expect(label.style.text).toBe("");
      expect(label.style.fill).toBe("black");
      label.useState(state, false, true);
      zoom = 2;
      render.updateGraphLabels(self, series);
      expect(label.style.text).toBe("First node");
      label.clearStates(true);
      expect(label.style.text).toBe("First node");
    },
  );

  test("reserves hidden label bounds without changing the visible text", () => {
    const label = new graphic.Text({style: {text: "", fontSize: 14}});
    label.x = 100;
    label.y = 100;
    const symbol = new graphic.Rect({shape: {x: 100, y: 100, width: 10, height: 10}});
    symbol.getTextContent = () => label;
    series.getData = () => ({
      getName: () => "A long node label",
      eachItemGraphicEl: (callback) => callback(symbol, 0),
    });
    const reserved = render.getGraphBounds(series, true);
    expect(reserved.width).toBeGreaterThan(10);
    expect(label.style.text).toBe("");
    label.setStyle("text", "A long node label");
    const visible = render.getGraphBounds(series);
    expect(reserved).toEqual(visible);
    label.setStyle("text", "");
    series.getFormattedLabel = () => "";
    const empty = render.getGraphBounds(series, true, "");
    expect(empty.width).toBe(10);
    expect(empty.height).toBe(10);
  });

  test.each([undefined, null])(
    "reserves the node name when a formatter returns %s",
    (formatted) => {
      const label = new graphic.Text({style: {text: "", fontSize: 14}});
      label.x = 100;
      label.y = 100;
      const symbol = new graphic.Rect({shape: {x: 100, y: 100, width: 10, height: 10}});
      symbol.getTextContent = () => label;
      series.getData = () => ({
        getName: () => "A long fallback node name",
        eachItemGraphicEl: (callback) => callback(symbol, 0),
      });
      series.getFormattedLabel = () => formatted;
      const reserved = render.getGraphBounds(series, true, () => formatted);
      expect(label.style.text).toBe("");
      label.setStyle("text", "A long fallback node name");
      expect(reserved).toEqual(render.getGraphBounds(series));
    },
  );

  test.each(["top", "bottom", "left", "right"])(
    "reserves the inherited alignment of a hidden %s label",
    (position) => {
      const label = new graphic.Text({style: {text: "", fontSize: 14}});
      const symbol = new graphic.Rect({shape: {x: 100, y: 100, width: 10, height: 10}});
      symbol.setTextContent(label);
      symbol.setTextConfig({
        position,
        outsideFill: "black",
        outsideStroke: "transparent",
      });
      symbol.update();
      series.getData = () => ({
        getName: () => "A long node label",
        eachItemGraphicEl: (callback) => callback(symbol, 0),
      });
      const reserved = render.getGraphBounds(series, true);
      expect(label.style.text).toBe("");
      label.setStyle("text", "A long node label");
      const visible = label.getBoundingRect().clone();
      visible.applyTransform(label.getComputedTransform());
      visible.union(symbol.getBoundingRect());
      expect(reserved).toEqual(visible);
    },
  );

  test("stops fitting when a settled graph has no drawable bounds", () => {
    view._layouting = false;
    jest.spyOn(render, "getGraphBounds").mockReturnValue(undefined);
    render.setupGraphFit(self);
    events.get("rendered")();
    jest.advanceTimersByTime(100);
    expect(self.graphFitted).toBe(true);
    expect(self.cancelGraphFit).toBeNull();
    expect(events.size).toBe(0);
  });

  test("finishes bounded fitting when label contents cannot fit", () => {
    view._layouting = false;
    jest
      .spyOn(render, "getGraphBounds")
      .mockReturnValue(new BoundingRect(0, 0, 1200, 30));
    render.setupGraphFit(self);
    events.get("rendered")();
    jest.advanceTimersByTime(2100);
    expect(self.graphFitted).toBe(true);
    expect(self.cancelGraphFit).toBeNull();
    expect(events.size).toBe(0);
  });

  test("limits each fitting pass to a few measurements and roam actions", () => {
    const measure = jest
      .spyOn(render, "getGraphBounds")
      .mockReturnValue(new BoundingRect(0, 0, 1200, 30));
    render.fitGraph(self, series);
    expect(measure.mock.calls.length).toBeLessThanOrEqual(3);
    expect(self.echarts.dispatchAction.mock.calls.length).toBeLessThanOrEqual(4);
  });

  test("bounds the work when a label is wider than the container", () => {
    jest
      .spyOn(render, "getGraphBounds")
      .mockReturnValue(new BoundingRect(0, 0, 1200, 30));
    render.fitGraph(self, series);
    expect(Number.isFinite(zoom)).toBe(true);
    expect(zoom).toBeGreaterThan(0);
    expect(self.echarts.dispatchAction.mock.calls.length).toBeLessThanOrEqual(22);
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
    series.getData = () => ({getName: () => "", eachItemGraphicEl: (fn) => fn(group)});
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
