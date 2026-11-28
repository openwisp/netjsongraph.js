import {By, Key, until} from "selenium-webdriver";
import {Origin, Pointer} from "selenium-webdriver/lib/input";
import {
  getElementByCss,
  getElementByXpath,
  tearDown,
  captureConsoleErrors,
  getDriver,
  getElementsByCss,
  getRenderedNodesAndLinksCount,
  getPresentNodesAndLinksCount,
  urls,
  printConsoleErrors,
} from "./browser.test.utils";

describe("Chart Rendering Test", () => {
  let driver;

  beforeAll(async () => {
    driver = await getDriver();
  });

  afterAll(async () => {
    await tearDown(driver);
  });

  test("fits during layout, ignores clicks and stops after a user pan", async () => {
    await driver.get(urls.customAttributes);
    await getElementByCss(driver, "canvas", 2000);
    await driver.executeScript(`
      graph.echarts.dispose();
      document.body.innerHTML = '<div id="fit-case" style="width:900px;height:600px"></div>';
      window.fitCase = new NetJSONGraph({type:'NetworkGraph',
        nodes:[{id:'a',label:'First node',x:100,y:100},{id:'b',label:'Second node',x:200,y:200}],
        links:[{source:'a',target:'b'}]
      }, {el:'#fit-case', metadata:false, showGraphLabelsAtZoom:1.1});
      window.fitSamples = [];
      const fit = fitCase.utils.fitGraph.bind(fitCase.utils);
      const start = performance.now();
      fitCase.utils.fitGraph = (self, series, state) => {
        const fitted = fit(self, series, state);
        const labels = [];
        series.getData().eachItemGraphicEl(el => labels.push(el.getSymbolPath().getTextContent().style.text));
        fitSamples.push({ms:performance.now()-start, zoom:series.get('zoom'), labels});
        return fitted;
      };
      fitCase.render();
    `);
    await driver.wait(
      () => driver.executeScript("return !!fitCase.cancelGraphFit"),
      2000,
    );
    expect(
      await driver.executeScript("return document.elementFromPoint(20, 100).tagName"),
    ).toBe("CANVAS");
    await driver
      .actions()
      .move({origin: Origin.VIEWPORT, x: 20, y: 100})
      .click()
      .perform();
    await driver.wait(
      () => driver.executeScript("return fitSamples.length >= 3"),
      1500,
      "Fitting should run during layout, even after an ordinary click",
    );
    const samples = await driver.executeScript("return fitSamples");
    expect(samples[0].ms).toBeLessThan(1000);
    expect(samples.some((sample) => sample.zoom > 1.1)).toBe(true);
    expect(samples.every((sample) => sample.labels.every((label) => !label))).toBe(
      true,
    );
    const result = await driver.executeAsyncScript(`
      const done = arguments[arguments.length - 1];
      const pendingBefore = !!fitCase.cancelGraphFit;
      fitCase.echarts.dispatchAction({type:'graphRoam',seriesId:'network-graph',dx:30,dy:20});
      const count = fitSamples.length;
      const before = fitCase.echarts.getOption().series[0];
      setTimeout(() => {
        const after = fitCase.echarts.getOption().series[0];
        done({pendingBefore, count, afterCount:fitSamples.length, before:{zoom:before.zoom,center:before.center},
          after:{zoom:after.zoom,center:after.center}, pending:!!fitCase.cancelGraphFit});
      }, 400);
    `);
    expect(result.pendingBefore).toBe(true);
    expect(result.afterCount).toBe(result.count);
    expect(result.after).toEqual(result.before);
    expect(result.pending).toBe(false);
  });

  test.each(["zoom", "pan"])(
    "refreshes labels when a %s interrupts fitting after restore",
    async (interaction) => {
      await driver.get(urls.customAttributes);
      await getElementByCss(driver, "canvas", 2000);
      await driver.executeScript(`
        graph.echarts.dispose();
        document.body.innerHTML='<div id="restore-case" style="width:900px;height:600px"></div>';
        window.restoreCase=new NetJSONGraph({type:'NetworkGraph',nodes:[
          {id:'a',label:'A',x:100,y:100},{id:'b',label:'B',x:200,y:200}],
          links:[{source:'a',target:'b'}]},
          {el:'#restore-case',metadata:false,showGraphLabelsAtZoom:2});
        restoreCase.render();
      `);
      await driver.wait(
        () => driver.executeScript("return restoreCase.graphFitted === true"),
        20000,
      );
      await driver.executeScript(
        "restoreCase.echarts.dispatchAction({type:'restore'});",
      );
      await driver.wait(
        () =>
          driver.executeScript(`return !!restoreCase.cancelGraphFit &&
          restoreCase.fitLabelsVisible === false &&
          restoreCase.echarts.getOption().series[0].zoom > 2`),
        5000,
        "Restore must still be fitting above the label threshold",
      );
      const result = await driver.executeAsyncScript(`
        const done=arguments[arguments.length-1],chart=restoreCase.echarts;
        const series=chart.getModel().getSeriesByIndex(0);
        const read=()=>({zoom:series.get('zoom'),pending:!!restoreCase.cancelGraphFit,
          text:series.getData().getItemGraphicEl(0).getSymbolPath().getTextContent().style.text});
        const before=read();
        const action=${interaction === "zoom" ? "{zoom:3/series.get('zoom'),originX:450,originY:300}" : "{dx:30,dy:20}"};
        chart.dispatchAction({type:'graphRoam',seriesId:'network-graph',...action});
        const after=read();
        setTimeout(()=>done({before,after,later:read()}),300);
      `);
      expect(result.before.pending).toBe(true);
      expect(result.before.text).toBe("");
      expect(result.after.pending).toBe(false);
      expect(result.after.zoom).toBeGreaterThan(2);
      expect(result.after.text).toBe("A");
      expect(result.later).toEqual(result.after);
    },
  );

  test("keeps hover labels in sync across the zoom threshold", async () => {
    await driver.get(urls.customAttributes);
    await getElementByCss(driver, "canvas", 2000);
    await driver.executeScript(`
      graph.echarts.dispose();
      document.body.innerHTML = '<div id="fit-case" style="width:900px;height:600px"></div>';
      window.fitCase = new NetJSONGraph({type:'NetworkGraph',
        nodes:[{id:'a',label:'First node',x:100,y:100},{id:'b',label:'Second node',x:200,y:200}],
        links:[{source:'a',target:'b'}]
      }, {el:'#fit-case', metadata:false, autoFitGraph:false, showGraphLabelsAtZoom:2,
        graphConfig:{series:{layout:'none',animation:false}}});
      fitCase.render();
    `);
    await driver.wait(
      () => driver.executeScript("return !!fitCase.echarts.getOption().series"),
      2000,
    );
    const act = async (action) =>
      driver.executeAsyncScript(
        `
        const done = arguments[arguments.length - 1];
        fitCase.echarts.dispatchAction({...arguments[0],seriesId:'network-graph'});
        setTimeout(() => {
          const data = fitCase.echarts.getModel().getSeriesByIndex(0).getData();
          const label = data.getItemGraphicEl(0).getSymbolPath().getTextContent();
          done({text:label.style.text,states:label.currentStates});
        }, 100);
      `,
        action,
      );
    await act({type: "graphRoam", zoom: 3, originX: 450, originY: 300});
    const highlighted = await act({type: "highlight", dataIndex: 0});
    expect(highlighted.states).toContain("emphasis");
    expect(highlighted.text).toBe("First node");
    const hidden = await act({
      type: "graphRoam",
      zoom: 1 / 3,
      originX: 450,
      originY: 300,
    });
    expect(hidden.states).toContain("emphasis");
    expect(hidden.text).toBe("");
    expect((await act({type: "downplay", dataIndex: 0})).text).toBe("");
    await act({type: "highlight", dataIndex: 0});
    const visible = await act({type: "graphRoam", zoom: 3, originX: 450, originY: 300});
    expect(visible.states).toContain("emphasis");
    expect(visible.text).toBe("First node");
    expect((await act({type: "downplay", dataIndex: 0})).text).toBe("First node");
    await printConsoleErrors(driver);
  });

  test.each([true, false])(
    "handles responsive zoom with autoFitGraph=%s",
    async (autoFitGraph) => {
      await driver.get(urls.customAttributes);
      await getElementByCss(driver, "canvas", 2000);
      await driver.executeScript(`
      graph.echarts.dispose();
      document.body.innerHTML = '<div id="resize-case" style="width:900px;height:600px"></div>';
      window.resizeCase = new NetJSONGraph({type:'NetworkGraph',
        nodes:[{id:'a',label:'A',x:100,y:100},{id:'b',label:'B',x:200,y:200}],links:[]
      }, {el:'#resize-case',metadata:false,autoFitGraph:${autoFitGraph},graphConfig:{series:{layout:'none',animation:false}}});
      resizeCase.render();
    `);
      await driver.wait(
        () =>
          driver.executeScript(
            "return resizeCase.echarts.getOption().series.length > 0 && (!resizeCase.config.autoFitGraph || resizeCase.graphFitted)",
          ),
        5000,
      );
      const result = await driver.executeScript(`
      const chart=resizeCase.echarts;
      const fitted=chart.getOption().series[0].zoom;
      chart.resize({width:450,height:600,animation:false});
      const narrow=chart.getOption().series[0].zoom;
      const toolbox=chart.getOption().toolbox[0].itemSize;
      chart.dispatchAction({type:'graphRoam',seriesId:'network-graph',zoom:0.8,dx:20,dy:10,originX:200,originY:300});
      const manual=chart.getOption().series[0];
      chart.resize({width:900,height:600,animation:false});
      const wide=chart.getOption().series[0];
      return {fitted,narrow,toolbox,manual:{zoom:manual.zoom,center:manual.center},wide:{zoom:wide.zoom,center:wide.center}};
    `);
      expect(result.toolbox).toBe(18);
      if (autoFitGraph) {
        expect(result.narrow).toBeCloseTo(result.fitted);
        expect(result.wide).toEqual(result.manual);
      } else {
        expect(result.narrow).toBe(0.7);
        expect(result.wide.zoom).toBe(1);
      }
    },
  );

  test.each([true, false])(
    "renders and updates object media series with autoFitGraph=%s",
    async (autoFitGraph) => {
      await driver.get(urls.customAttributes);
      await getElementByCss(driver, "canvas", 2000);
      await driver.executeScript(`
        graph.echarts.dispose();
        document.body.innerHTML='<div id="media-case" style="width:900px;height:600px"></div>';
        window.mediaCase=new NetJSONGraph({type:'NetworkGraph',nodes:[
          {id:'a',label:'A',x:100,y:100},{id:'b',label:'B',x:200,y:200}],links:[]},
          {el:'#media-case',metadata:false,autoFitGraph:${autoFitGraph},graphConfig:{
            series:{layout:'none',animation:false},
            baseOptions:{media:[{query:{maxWidth:600},option:{series:{label:{color:'red'}}}}]}
          }});
        mediaCase.render();
      `);
      await driver.wait(
        () =>
          driver.executeScript(`return mediaCase.echarts.getOption().series.length > 0 &&
          (!mediaCase.config.autoFitGraph || mediaCase.graphFitted)`),
        5000,
        "Object-valued media settings must allow the graph to render",
      );
      const result = await driver.executeAsyncScript(`
        const done=arguments[arguments.length-1],chart=mediaCase.echarts;
        const read=()=>{const series=chart.getOption().series[0];
          return {zoom:series.zoom,center:series.center};};
        chart.dispatchAction({type:'graphRoam',seriesId:'network-graph',zoom:0.8,dx:20,dy:10,originX:450,originY:300});
        const before=read();
        mediaCase.utils.JSONDataUpdate.call(mediaCase,mediaCase.data).then(()=>{
          const after=read();
          chart.resize({width:450,height:600,animation:false});
          done({before,after,narrow:read(),color:chart.getOption().series[0].label.color});
        }).catch(error=>done({error:error.message}));
      `);
      expect(result.error).toBeUndefined();
      expect(result.after).toEqual(result.before);
      expect(result.narrow).toEqual(result.after);
      expect(result.color).toBe("red");
    },
  );

  test.each([0.5, 2, 3])(
    "preserves custom label formatters with threshold %s",
    async (threshold) => {
      await driver.get(urls.customAttributes);
      await getElementByCss(driver, "canvas", 2000);
      await driver.executeScript(`
      graph.echarts.dispose();
      document.body.innerHTML='<div id="label-case" style="width:900px;height:600px"></div>';
      window.labelCase=new NetJSONGraph({type:'NetworkGraph',nodes:[{id:'a',label:'A',x:100,y:100},{id:'b',label:'B',x:200,y:200}],links:[]},
        {el:'#label-case',metadata:false,autoFitGraph:false,showGraphLabelsAtZoom:${threshold},
         graphConfig:{series:{layout:'none',animation:false,label:{formatter:${threshold === 3 ? "''" : "'Normal: {b}'"}},
           emphasis:{label:{formatter:'Details: {b}'}},blur:{label:{formatter:p=>'Blur: '+p.name}},select:{label:{formatter:'Selected: {b}'}}}}});
      labelCase.render();
    `);
      await driver.wait(
        () =>
          driver.executeScript(
            "return labelCase.echarts.getOption().series.length > 0",
          ),
        5000,
      );
      const result = await driver.executeScript(`
      const chart=labelCase.echarts;
      const label=chart.getModel().getSeriesByIndex(0).getData().getItemGraphicEl(0).getSymbolPath().getTextContent();
      const texts=()=>({normal:label.style.text,emphasis:label.states.emphasis.style.text,blur:label.states.blur.style.text,select:label.states.select.style.text});
      const before=texts();
      chart.dispatchAction({type:'graphRoam',seriesId:'network-graph',zoom:0.2,originX:450,originY:300});
      const hidden=texts();
      chart.dispatchAction({type:'graphRoam',seriesId:'network-graph',zoom:20,originX:450,originY:300});
      return {before,hidden,after:texts(),zoom:chart.getModel().getSeriesByIndex(0).get('zoom')};
    `);
      const expected = {
        normal: threshold === 3 ? "" : "Normal: A",
        emphasis: "Details: A",
        blur: "Blur: A",
        select: "Selected: A",
      };
      expect(result.before).toEqual(
        threshold < 1 ? expected : {normal: "", emphasis: "", blur: "", select: ""},
      );
      expect(result.hidden).toEqual({normal: "", emphasis: "", blur: "", select: ""});
      expect(result.zoom).toBeGreaterThan(threshold);
      expect(result.after).toEqual(expected);
    },
  );

  test.each(["string", "function"])(
    "preserves %s label formatters after legend filtering",
    async (kind) => {
      await driver.get(urls.customAttributes);
      await getElementByCss(driver, "canvas", 2000);
      await driver.executeScript(`
        graph.echarts.dispose();
        document.body.innerHTML='<div id="legend-case" style="width:900px;height:600px"></div>';
        window.legendCase=new NetJSONGraph({type:'NetworkGraph',nodes:[
          {id:'a',label:'A',category:0,x:100,y:100},
          {id:'b',label:'B',category:1,x:200,y:200},
          {id:'c',label:'C',category:1,x:300,y:300}],links:[]},
          {el:'#legend-case',metadata:false,autoFitGraph:false,showGraphLabelsAtZoom:0.5,
           graphConfig:{series:{layout:'none',animation:false,categories:[{name:'Hidden'},{name:'Visible'}],
             label:{formatter:${kind === "string" ? "'Label: {b}'" : "p => 'Label: '+p.name+' ('+p.dataIndex+')'"}}},
             baseOptions:{legend:{data:['Hidden','Visible']}}}});
        legendCase.render();
      `);
      await driver.wait(
        () =>
          driver.executeScript(
            "return legendCase.echarts.getOption().series.length > 0",
          ),
        5000,
      );
      const result = await driver.executeScript(`
        const chart=legendCase.echarts;
        const read=()=>{const data=chart.getModel().getSeriesByIndex(0).getData();
          return Array.from({length:data.count()},(_,i)=>({name:data.getName(i),raw:data.getRawIndex(i),
            text:data.getItemGraphicEl(i).getSymbolPath().getTextContent().style.text}));};
        const before=read();
        chart.dispatchAction({type:'legendUnSelect',name:'Hidden'});
        const filtered=read();
        chart.dispatchAction({type:'graphRoam',seriesId:'network-graph',zoom:1.1,originX:450,originY:300});
        const zoomed=read();
        chart.dispatchAction({type:'legendSelect',name:'Hidden'});
        return {before,filtered,zoomed,restored:read()};
      `);
      const expected = ["A", "B", "C"].map((name, raw) => ({
        name,
        raw,
        text: `Label: ${name}${kind === "function" ? ` (${raw})` : ""}`,
      }));
      expect(result.before).toEqual(expected);
      expect(result.filtered).toEqual(expected.slice(1));
      expect(result.zoomed).toEqual(expected.slice(1));
      expect(result.restored).toEqual(expected);
    },
  );

  test.each(["undefined", "null"])(
    "fits fallback label bounds when the formatter returns %s",
    async (formatted) => {
      await driver.get(urls.customAttributes);
      await getElementByCss(driver, "canvas", 2000);
      await driver.executeScript(`
        graph.echarts.dispose();
        document.body.innerHTML='<div id="fallback-case" style="width:900px;height:600px"></div>';
        window.fallbackCase=new NetJSONGraph({type:'NetworkGraph',nodes:[
          {id:'a',label:'Long name '.repeat(12),x:100,y:100},
          {id:'b',label:'Long name '.repeat(12),x:200,y:200}],links:[]},
          {el:'#fallback-case',metadata:false,svgRender:true,showGraphLabelsAtZoom:1.01,
            echartsOption:{toolbox:{show:false}},
           graphConfig:{series:{layout:'none',animation:false,label:{formatter:()=>${formatted}}}}});
        fallbackCase.render();
      `);
      await driver.wait(
        () => driver.executeScript("return fallbackCase.graphFitted === true"),
        5000,
        "Fitting did not finish with a fallback label",
      );
      const result = await driver.executeScript(`
        const chart=fallbackCase.echarts, container=chart.getDom();
        const view=()=>{const series=chart.getOption().series[0];
          return {zoom:series.zoom,center:series.center};};
        const before=view();
        const hidden=Array.from(container.querySelectorAll('svg text'),el=>el.textContent);
        // Reveal the reserved text without zooming, moving nodes or fitting again.
        fallbackCase.config.showGraphLabelsAtZoom=0.000001;
        chart.dispatchAction({type:'graphRoam',seriesId:'network-graph',zoom:1,originX:450,originY:300});
        chart.getZr().refreshImmediately();
        const origin=container.getBoundingClientRect();
        const measure=selector=>Array.from(container.querySelectorAll(selector),el=>{
          const rect=el.getBoundingClientRect();
          return {x:rect.left-origin.left,right:rect.right-origin.left,
            y:rect.top-origin.top,bottom:rect.bottom-origin.top};
        });
        return {before,after:view(),hidden,
          nodes:measure('svg path'),labels:measure('svg text'),
          text:Array.from(container.querySelectorAll('svg text'),el=>el.textContent)};
      `);
      expect(result.after.zoom).toBeCloseTo(result.before.zoom, 8);
      result.after.center.forEach((coordinate, index) => {
        expect(coordinate).toBeCloseTo(result.before.center[index], 8);
      });
      expect(result.nodes).toHaveLength(2);
      expect(result.labels).toHaveLength(2);
      expect(result.text).toEqual(["Long name ".repeat(12), "Long name ".repeat(12)]);
      [...result.nodes, ...result.labels].forEach((bounds) => {
        expect(bounds.right).toBeGreaterThan(bounds.x);
        expect(bounds.bottom).toBeGreaterThan(bounds.y);
        expect(bounds.x).toBeGreaterThanOrEqual(39.5);
        expect(bounds.right).toBeLessThanOrEqual(860.5);
        expect(bounds.y).toBeGreaterThanOrEqual(39.5);
        expect(bounds.bottom).toBeLessThanOrEqual(560.5);
      });
      expect(result.before.zoom).toBeLessThan(1.01);
      expect(result.hidden.every((text) => text === "")).toBe(true);
    },
  );

  test("fits long labels inside the padded container", async () => {
    await driver.get(urls.customAttributes);
    await getElementByCss(driver, "canvas", 2000);
    await driver.executeScript(`
      graph.echarts.dispose();
      document.body.innerHTML = '<div id="fit-case" style="width:900px;height:600px"></div>';
      window.fitCase = new NetJSONGraph({type:'NetworkGraph',
        nodes:[{id:'a',label:'Long name '.repeat(12),x:100,y:100},
          {id:'b',label:'Long name '.repeat(12),x:200,y:200}],
        links:[{source:'a',target:'b'}]
      }, {el:'#fit-case',metadata:false,graphConfig:{series:{layout:'none'}}});
      fitCase.render();
    `);
    await driver.wait(
      () => driver.executeScript("return fitCase.graphFitted === true"),
      5000,
    );
    const bounds = await driver.executeScript(`
      const series = fitCase.echarts.getModel().getSeriesByIndex(0);
      const b = fitCase.utils.getGraphBounds(series);
      return {x:b.x,y:b.y,width:b.width,height:b.height};
    `);
    expect(bounds.x).toBeGreaterThanOrEqual(39.5);
    expect(bounds.y).toBeGreaterThanOrEqual(39.5);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(860.5);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(560.5);
    expect(bounds.width).toBeGreaterThan(800);
  });

  test("fits a fresh graph after switching to a map and back", async () => {
    await driver.get(urls.geographicMap);
    await driver.wait(
      () => driver.executeScript("return !!(window.map && window.map.leaflet)"),
      5000,
    );
    await driver.executeScript(`
      map.echarts.dispose();
      document.body.innerHTML = '<div id="mode-case" style="width:900px;height:600px"></div>';
      window.modeCase = new NetJSONGraph({type:'NetworkGraph',
        nodes:[{id:'a',properties:{location:{lat:47,lng:19}}},
          {id:'b',properties:{location:{lat:48,lng:20}}}],
        links:[{source:'a',target:'b'}]
      }, {el:'#mode-case',metadata:false,switchMode:true,mapOptions:{center:[47,19],zoom:5}});
      modeCase.render();
    `);
    await driver.wait(
      () =>
        driver.executeScript(
          "return typeof modeCase !== 'undefined' && modeCase.graphFitted === true",
        ),
      15000,
    );
    await driver.executeScript("modeCase.gui.renderModeSelector.click()");
    expect(await driver.executeScript("return modeCase.leaflet.getZoom()")).toBe(5);
    expect(
      await driver.executeScript("return modeCase.el.classList.contains('njg-map')"),
    ).toBe(true);
    await driver.executeScript("modeCase.gui.renderModeSelector.click()");
    expect(await driver.executeScript("return modeCase.graphFitted")).toBe(false);
    await driver.wait(
      () => driver.executeScript("return modeCase.graphFitted === true"),
      15000,
    );
    const result = await driver.executeScript(`
      const chart = modeCase.echarts;
      const series = chart.getModel().getSeriesByIndex(0);
      const b = modeCase.utils.getGraphBounds(series);
      return {id:series.id,x:b.x,y:b.y,right:b.x+b.width,bottom:b.y+b.height,
        width:chart.getWidth(),height:chart.getHeight()};
    `);
    expect(result.id).toBe("network-graph");
    expect(result.x).toBeGreaterThanOrEqual(39);
    expect(result.y).toBeGreaterThanOrEqual(39);
    expect(result.right).toBeLessThanOrEqual(result.width - 39);
    expect(result.bottom).toBeLessThanOrEqual(result.height - 39);
    const errors = await captureConsoleErrors(driver);
    printConsoleErrors(errors);
    expect(errors).toEqual([]);
  }, 35000);

  test("fits the graph, preserves manual zoom and fits again after restore", async () => {
    await driver.get(urls.customAttributes);
    await driver.wait(
      () =>
        driver.executeScript(
          "return typeof graph !== 'undefined' && graph.graphFitted === true",
        ),
      15000,
      "The initial graph should fit after the force layout stops",
    );
    const measure = () =>
      driver.executeScript(`
      const chart = graph.echarts;
      const series = chart.getModel().getSeriesByIndex(0);
      const data = series.getData();
      const points = [];
      data.each(i => points.push(series.coordinateSystem.dataToPoint(data.getItemLayout(i))));
      return {
        zoom: chart.getOption().series[0].zoom,
        moving: chart.getViewOfSeriesModel(series)._layouting,
        width: chart.getWidth(), height: chart.getHeight(),
        left: Math.min(...points.map(p => p[0])),
        right: Math.max(...points.map(p => p[0])),
        top: Math.min(...points.map(p => p[1])),
        bottom: Math.max(...points.map(p => p[1]))
      };
    `);
    const fitted = await measure();
    expect(fitted.moving).toBe(false);
    expect(fitted.left).toBeGreaterThan(0);
    expect(fitted.top).toBeGreaterThan(0);
    expect(fitted.right).toBeLessThan(fitted.width);
    expect(fitted.bottom).toBeLessThan(fitted.height);
    expect(
      Math.max(
        (fitted.right - fitted.left) / fitted.width,
        (fitted.bottom - fitted.top) / fitted.height,
      ),
    ).toBeGreaterThan(0.6);
    const manualZoom = await driver.executeAsyncScript(`
      const done = arguments[arguments.length - 1];
      graph.echarts.dispatchAction({type:'graphRoam', seriesId:'network-graph',
        zoom:0.5, originX:graph.echarts.getWidth()/2, originY:graph.echarts.getHeight()/2});
      setTimeout(() => done(graph.echarts.getOption().series[0].zoom), 300);
    `);
    expect(manualZoom).toBeCloseTo(fitted.zoom * 0.5);
    const updated = await driver.executeAsyncScript(`
      const done = arguments[arguments.length - 1];
      const chart = graph.echarts;
      chart.dispatchAction({type:'graphRoam',seriesId:'network-graph',dx:40,dy:20});
      const before = chart.getOption().series[0];
      graph.utils.JSONDataUpdate.call(graph, graph.data).then(() => {
        const after = chart.getOption().series[0];
        done({before:{zoom:before.zoom,center:before.center},after:{zoom:after.zoom,center:after.center}});
      });
    `);
    expect(updated.after).toEqual(updated.before);
    await driver.executeScript("graph.echarts.dispatchAction({type:'restore'});");
    await driver.wait(
      () => driver.executeScript("return graph.graphFitted === true"),
      15000,
      "Restore view should fit the graph after layout completion",
    );
    const restored = await measure();
    expect(restored.moving).toBe(false);
    expect(restored.zoom).toBeGreaterThan(0);
    expect(restored.left).toBeGreaterThan(0);
    expect(restored.top).toBeGreaterThan(0);
    expect(restored.right).toBeLessThan(restored.width);
    expect(restored.bottom).toBeLessThan(restored.height);
    expect(
      Math.max(
        (restored.right - restored.left) / restored.width,
        (restored.bottom - restored.top) / restored.height,
      ),
    ).toBeGreaterThan(0.6);
  }, 35000);

  test.each([
    {layout: "force", layoutAnimation: true, nodeSize: 15},
    {layout: "force", layoutAnimation: false, nodeSize: 15},
    {layout: "none", layoutAnimation: false, nodeSize: 15},
    {layout: "none", layoutAnimation: false, nodeSize: 200},
  ])(
    "fits $layout layouts (animation: $layoutAnimation, node size: $nodeSize) with zoom-dependent labels",
    async ({layout, layoutAnimation, nodeSize}) => {
      await driver.get(urls.customAttributes);
      await getElementByCss(driver, "canvas", 2000);
      await driver.executeScript(
        `
      graph.echarts.dispose();
      document.body.innerHTML = '<div id="fit-case" style="width:900px;height:600px"></div>';
      window.fitCase = new NetJSONGraph({
        type:'NetworkGraph',
        nodes:[{id:'a',label:'First node',x:100,y:100},{id:'b',label:'Second node',x:200,y:200}],
        links:[{source:'a',target:'b'}]
      }, {
        el:'#fit-case', metadata:false, showGraphLabelsAtZoom:1.1,
        graphConfig:{series:{layout:arguments[0],force:{layoutAnimation:arguments[1]},nodeSize:arguments[2],animationDuration:1500}}
      });
      fitCase.render();
    `,
        layout,
        layoutAnimation,
        nodeSize,
      );
      await driver.wait(
        () =>
          driver.executeScript(`
          const chart = fitCase.echarts;
          const series = chart.getModel().getSeriesByIndex(0);
          return fitCase.graphFitted === true && !chart.getViewOfSeriesModel(series)._layouting && chart.getZr().animation.isFinished();
        `),
        20000,
        "The fitted graph should finish layout with its labels refreshed",
      );
      const result = await driver.executeScript(`
      const chart = fitCase.echarts;
      const series = chart.getModel().getSeriesByIndex(0);
      const data = series.getData();
      const labels = [];
      const points = [];
      const labelBounds = [];
      data.eachItemGraphicEl(el => {
        const label = el.getSymbolPath().getTextContent();
        labels.push(label.style.text);
        if (label.style.text && !label.ignore) {
          const rect = label.getBoundingRect().clone();
          rect.applyTransform(label.getComputedTransform());
          labelBounds.push({x:rect.x,y:rect.y,width:rect.width,height:rect.height});
        }
      });
      data.each(i => points.push(series.coordinateSystem.dataToPoint(data.getItemLayout(i))));
      return {zoom:chart.getOption().series[0].zoom, labels, points, labelBounds};
    `);
      expect(result.labels).toEqual(
        result.zoom >= 1.1 ? ["First node", "Second node"] : ["", ""],
      );
      result.points.forEach(([x, y]) => {
        expect(x).toBeGreaterThan(0);
        expect(x).toBeLessThan(900);
        expect(y).toBeGreaterThan(0);
        expect(y).toBeLessThan(600);
      });
      result.labelBounds.forEach(({x, y, width, height}) => {
        expect(x).toBeGreaterThan(0);
        expect(y).toBeGreaterThan(0);
        expect(x + width).toBeLessThan(900);
        expect(y + height).toBeLessThan(600);
      });
      if (layout === "none") {
        await driver.executeScript("fitCase.echarts.dispatchAction({type:'restore'});");
        await driver.wait(
          () => driver.executeScript("return fitCase.graphFitted === true"),
          5000,
          "Restore view should also fit a fixed layout",
        );
        const restored = await driver.executeScript(`
          const chart = fitCase.echarts;
          const labels = [];
          chart.getModel().getSeriesByIndex(0).getData().eachItemGraphicEl(el =>
            labels.push(el.getSymbolPath().getTextContent().style.text));
          return {zoom: chart.getOption().series[0].zoom, labels};
        `);
        expect(restored.zoom).toBeCloseTo(result.zoom);
        expect(restored.labels).toEqual(result.labels);
      }
    },
    25000,
  );

  test("render the Basic usage example without console errors", async () => {
    driver.get(urls.basicUsage);
    const canvas = await getElementByCss(driver, "canvas", 2000);
    const consoleErrors = await captureConsoleErrors(driver);
    printConsoleErrors(consoleErrors);
    const {nodesRendered, linksRendered} = await getRenderedNodesAndLinksCount(driver);
    const {nodesPresent, linksPresent} =
      await getPresentNodesAndLinksCount("Basic usage");
    expect(consoleErrors.length).toBe(0);
    expect(canvas).not.toBeNull();
    expect(nodesRendered).toBe(nodesPresent);
    expect(linksRendered).toBe(linksPresent);
  });

  test("render the Geographic map example without console errors", async () => {
    driver.get(urls.geographicMap);
    const leafletContainer = await getElementByCss(
      driver,
      ".ec-extension-leaflet",
      2000,
    );
    const canvases = await getElementsByCss(
      driver,
      ".ec-extension-leaflet .leaflet-overlay-pane canvas",
    );
    const {nodesRendered, linksRendered} = await getRenderedNodesAndLinksCount(driver);
    const {nodesPresent, linksPresent} =
      await getPresentNodesAndLinksCount("Geographic map");
    const consoleErrors = await captureConsoleErrors(driver);
    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
    expect(leafletContainer).not.toBeNull();
    expect(canvases.length).toBeGreaterThan(0);
    expect(nodesRendered).toBe(nodesPresent);
    expect(linksRendered).toBe(linksPresent);
  });

  test("keep selections after modifier release", async () => {
    await driver.get(urls.customAttributes);
    await getElementByCss(driver, "canvas", 2000);
    const selected = await driver.executeScript(`
      const [firstNode, secondNode] = graph.data.nodes;
      graph.utils.highlightNode(firstNode, {append: true, toggle: true});
      graph.utils.highlightNode(secondNode, {append: true, toggle: true});
      window.dispatchEvent(new KeyboardEvent("keyup", {key: "Control"}));
      return {
        selected: graph.activeHighlightedElements.map((item) => item.key),
        expected: [firstNode, secondNode].map((node) => "node:" + node.id),
      };
    `);
    expect(selected.selected).toEqual(selected.expected);
  });

  test("no blank tiles on canvas at max zoom", async () => {
    driver.get(urls.geographicMap);
    const zoomIn = await getElementByCss(driver, ".leaflet-control-zoom-in", 2000);
    let click = 0;
    while (click < 50) {
      // eslint-disable-next-line no-await-in-loop
      const className = await zoomIn.getAttribute("class");
      if (className.includes("leaflet-disabled")) {
        break;
      }
      zoomIn.click();
      click += 1;
    }
    await driver.sleep(500);
    const consoleErrors = await captureConsoleErrors(driver);
    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
  });

  test("render floorplan map without console errors", async () => {
    driver.get(urls.indoorMap);
    const canvas = await getElementByCss(driver, "canvas", 2000);
    const floorplanImage = getElementByCss(driver, "leaflet-image-layer");
    const consoleErrors = await captureConsoleErrors(driver);
    const {nodesRendered, linksRendered} = await getRenderedNodesAndLinksCount(driver);
    const {nodesPresent, linksPresent} =
      await getPresentNodesAndLinksCount("Indoor map");
    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
    expect(canvas).not.toBeNull();
    expect(floorplanImage).not.toBeNull();
    expect(nodesRendered).toBe(nodesPresent);
    expect(linksRendered).toBe(linksPresent);
  });

  test("render custom attributes example without errors", async () => {
    driver.get(urls.customAttributes);
    const canvas = await getElementByCss(driver, "canvas", 2000);
    const consoleErrors = await captureConsoleErrors(driver);
    /* eslint-disable no-unused-vars */
    const {nodesRendered, linksRendered} = await getRenderedNodesAndLinksCount(driver);
    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
    expect(canvas).not.toBeNull();
    const canvasHeight = await driver.executeScript(
      "return graph.echarts.getRenderedCanvas().height",
    );
    const windowHeight = await driver.executeScript("return window.innerHeight");
    expect(canvasHeight).not.toBe(0);
    expect(canvasHeight).toBe(windowHeight);
    const nodesCount = await driver.executeScript("return graph.data.nodes.length");
    const linksCount = await driver.executeScript("return graph.data.links.length");
    expect(nodesCount).toBe(6);
    expect(linksCount).toBe(7);
  });

  test("render wifi clients example without errors", async () => {
    await driver.get(urls.wifiClients);
    const canvas = await getElementByCss(driver, "canvas", 2000);
    const sideBar = await getElementByCss(driver, ".njg-sideBar", 2000);
    const consoleErrors = await captureConsoleErrors(driver);
    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
    expect(canvas).not.toBeNull();
    expect(sideBar).not.toBeNull();

    const canvasHeight = await driver.executeScript(
      "return graph.echarts.getRenderedCanvas().height",
    );
    const windowHeight = await driver.executeScript("return window.innerHeight");
    expect(canvasHeight).not.toBe(0);
    expect(canvasHeight).toBe(windowHeight);

    const nodesCount = await driver.executeScript("return graph.data.nodes.length");
    const linksCount = await driver.executeScript("return graph.data.links.length");
    expect(nodesCount).toBe(4);
    expect(linksCount).toBe(3);

    const hasDots = await driver.executeScript(
      "return !!document.querySelector('canvas') && !!graph.echarts",
    );
    expect(hasDots).toBe(true);
  });

  test("render Geographic map with GeoJSON data without console errors", async () => {
    await driver.get(urls.geoJson);
    const leafletContainer = await getElementByCss(
      driver,
      ".ec-extension-leaflet",
      2000,
    );
    const consoleErrors = await captureConsoleErrors(driver);
    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
    expect(leafletContainer).not.toBeNull();

    // GeoJSON rendering may not show metadata counts the same way as NetJSON
    // The important check is that it renders without errors
  });

  test("bookmarkableActions: render Basic usage example with url fragments for a node", async () => {
    await driver.get(`${urls.basicUsage}#id=basicUsage&nodeId=10.149.3.3`);
    const canvas = await getElementByCss(driver, "canvas", 2000);
    const consoleErrors = await captureConsoleErrors(driver);
    const sideBar = await getElementByCss(driver, ".njg-sideBar", 2000);
    const node = await getElementByXpath(
      driver,
      "//span[@class='njg-valueLabel' and text()='10.149.3.3']",
      2000,
    );
    // Use textContent rather than getText(): in the popup-based examples the
    // sidebar is hidden via CSS, and Selenium's getText() returns "" for
    // elements that aren't visible. textContent gives us the raw text
    // regardless of layout state, so all the bookmarkable tests stay
    // consistent across visible-sidebar and hidden-sidebar examples.
    const nodeId = await node.getAttribute("textContent");
    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
    expect(canvas).not.toBeNull();
    expect(sideBar).not.toBeNull();
    expect(nodeId).toBe("10.149.3.3");
  });

  test("bookmarkableActions: render Basic usage example with url fragments for a link", async () => {
    await driver.get(
      `${urls.basicUsage}#id=basicUsage&nodeId=172.16.155.5~172.16.155.4`,
    );
    const canvas = await getElementByCss(driver, "canvas", 2000);
    const consoleErrors = await captureConsoleErrors(driver);
    const sideBar = await getElementByCss(driver, ".njg-sideBar", 2000);
    const source = await getElementByXpath(
      driver,
      "//span[@class='njg-valueLabel' and text()='172.16.155.5']",
      2000,
    );
    const target = await getElementByXpath(
      driver,
      "//span[@class='njg-valueLabel' and text()='172.16.155.4']",
      2000,
    );
    const sourceId = await source.getAttribute("textContent");
    const targetId = await target.getAttribute("textContent");

    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
    expect(canvas).not.toBeNull();
    expect(sideBar).not.toBeNull();
    expect(sourceId).toBe("172.16.155.5");
    expect(targetId).toBe("172.16.155.4");
  });

  test("bookmarkableActions: render Geographic map example with url fragments for a node", async () => {
    await driver.get(`${urls.geographicMap}#id=geographicMap&nodeId=172.16.169.1`);
    const canvas = await getElementByCss(driver, "canvas", 2000);
    const consoleErrors = await captureConsoleErrors(driver);
    const sideBar = await getElementByCss(driver, ".njg-sideBar", 2000);
    const node = await getElementByXpath(
      driver,
      "//span[@class='njg-valueLabel' and text()='172.16.169.1']",
      2000,
    );
    const nodeId = await node.getAttribute("textContent");

    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
    expect(canvas).not.toBeNull();
    expect(sideBar).not.toBeNull();
    expect(nodeId).toBe("172.16.169.1");
  });

  test("bookmarkableActions: render Geographic map example with url fragments for a link", async () => {
    await driver.get(
      `${urls.geographicMap}#id=geographicMap&nodeId=172.16.185.12~172.16.185.13`,
    );
    const canvas = await getElementByCss(driver, "canvas", 2000);
    const consoleErrors = await captureConsoleErrors(driver);
    const sideBar = await getElementByCss(driver, ".njg-sideBar", 2000);
    const source = await getElementByXpath(
      driver,
      "//span[@class='njg-valueLabel' and text()='172.16.185.12']",
      2000,
    );
    const target = await getElementByXpath(
      driver,
      "//span[@class='njg-valueLabel' and text()='172.16.185.13']",
      2000,
    );
    const sourceId = await source.getAttribute("textContent");
    const targetId = await target.getAttribute("textContent");

    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
    expect(canvas).not.toBeNull();
    expect(sideBar).not.toBeNull();
    expect(sourceId).toBe("172.16.185.12");
    expect(targetId).toBe("172.16.185.13");
  });

  test("bookmarkableActions: render indoor overlay example without JS console errors", async () => {
    await driver.get(urls.indoorMapOverlay);
    const canvas = await getElementByCss(driver, "canvas", 2000);
    const consoleErrors = await captureConsoleErrors(driver);
    printConsoleErrors(consoleErrors);
    const {nodesRendered, linksRendered} = await getRenderedNodesAndLinksCount(driver);
    const {nodesPresent, linksPresent} =
      await getPresentNodesAndLinksCount("Geographic map");
    expect(consoleErrors.length).toBe(0);
    expect(canvas).not.toBeNull();
    expect(nodesRendered).toBe(nodesPresent);
    expect(linksRendered).toBe(linksPresent);

    await driver.executeScript('window._geoMap.utils.triggerOnClick("172.16.171.15");');
    let currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain("172.16.171.15");
    const floorplanBtn = await getElementByCss(driver, ".njg-popup-button", 2000);
    expect(floorplanBtn).not.toBeNull();
    // Use JS click to avoid Leaflet popup click interception in Chrome
    await driver.executeScript("arguments[0].click();", floorplanBtn);
    // wait for overlay to open and render indoor map
    await driver.sleep(500);
    let indoorContainer = await getElementByCss(driver, "#indoormap-container", 2000);
    const indoorCanvas = await getElementByCss(driver, "canvas", 2000);
    const floorplanImage = await getElementByCss(driver, ".leaflet-image-layer", 2000);
    const indoorConsoleErrors = await captureConsoleErrors(driver);
    const {nodesRendered: indoorNodesRendered, linksRendered: indoorLinksRendered} =
      await getRenderedNodesAndLinksCount(driver);
    const {nodesPresent: indoorNodesPresent, linksPresent: indoorLinksPresent} =
      await getPresentNodesAndLinksCount("Indoor map");
    printConsoleErrors(indoorConsoleErrors);
    expect(indoorConsoleErrors.length).toBe(0);
    expect(indoorContainer).not.toBeNull();
    expect(indoorCanvas).not.toBeNull();
    expect(floorplanImage).not.toBeNull();
    expect(indoorNodesRendered).toBe(indoorNodesPresent);
    expect(indoorLinksRendered).toBe(indoorLinksPresent);
    await driver.executeScript('window._indoorMap.utils.triggerOnClick("node_2");');
    currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain("node_2");
    const closeBtn = await getElementByCss(driver, "#indoormap-close");
    expect(closeBtn).not.toBeNull();
    await closeBtn.click();
    indoorContainer = await getElementByCss(driver, "#indoormap-container", 2000);
    expect(indoorContainer).toBeNull();
  });

  test("bookmarkableActions: indoor overlay removes popstate listener on close", async () => {
    await driver.get(urls.indoorMapOverlay);
    const canvas = await getElementByCss(driver, "canvas", 2000);
    expect(canvas).not.toBeNull();
    await driver.executeScript(`
      window._popstateTracker = {added: [], removed: []};
      const originalAdd = window.addEventListener.bind(window);
      const originalRemove = window.removeEventListener.bind(window);
      window._restorePopstateTracker = () => {
        window.addEventListener = originalAdd;
        window.removeEventListener = originalRemove;
      };
      window.addEventListener = (type, listener, options) => {
        if (type === "popstate") {
          window._popstateTracker.added.push(listener);
        }
        return originalAdd(type, listener, options);
      };
      window.removeEventListener = (type, listener, options) => {
        if (type === "popstate") {
          window._popstateTracker.removed.push(listener);
        }
        return originalRemove(type, listener, options);
      };
    `);
    await driver.executeScript('window._geoMap.utils.triggerOnClick("172.16.171.15");');
    const floorplanBtn = await getElementByCss(driver, ".njg-popup-button", 2000);
    await driver.executeScript("arguments[0].click();", floorplanBtn);
    const closeBtn = await getElementByCss(driver, "#indoormap-close", 2000);
    await driver.wait(
      () => driver.executeScript("return window._popstateTracker.added.length > 0;"),
      2000,
    );
    await closeBtn.click();
    const popstateStats = await driver.executeScript(`
      const {added, removed} = window._popstateTracker;
      window._restorePopstateTracker();
      return {
        added: added.length,
        leaked: added.filter((listener) => !removed.includes(listener)).length,
      };
    `);
    expect(popstateStats.added).toBeGreaterThan(0);
    expect(popstateStats.leaked).toBe(0);
  });

  test("bookmarkableActions: closing indoor overlay during image decode keeps it closed", async () => {
    await driver.get(urls.indoorMapOverlay);
    const canvas = await getElementByCss(driver, "canvas", 2000);
    expect(canvas).not.toBeNull();
    await driver.executeScript(`
      const originalDecode = Image.prototype.decode;
      window._restoreIndoorImageDecode = () => {
        Image.prototype.decode = originalDecode;
      };
      Image.prototype.decode = function () {
        if (this.src.includes("floorplan.png")) {
          return new Promise((resolve) => {
            window._resolveIndoorImageDecode = resolve;
          });
        }
        return originalDecode.call(this);
      };
    `);
    await driver.executeScript('window._geoMap.utils.triggerOnClick("172.16.171.15");');
    const floorplanBtn = await getElementByCss(driver, ".njg-popup-button", 2000);
    await driver.executeScript("arguments[0].click();", floorplanBtn);
    const closeBtn = await getElementByCss(driver, "#indoormap-close", 2000);
    await driver.wait(
      () =>
        driver.executeScript(
          "return typeof window._resolveIndoorImageDecode === 'function';",
        ),
      2000,
    );
    await closeBtn.click();
    await driver.executeScript(`
      window._resolveIndoorImageDecode();
      window._restoreIndoorImageDecode();
    `);
    await driver.sleep(500);
    const currentUrl = await driver.getCurrentUrl();
    const indoorContainer = await getElementByCss(driver, "#indoormap-container");
    expect(currentUrl).not.toContain("id=indoorMap");
    expect(indoorContainer).toBeNull();
  });

  test("bookmarkableActions: test url fragments for nodes", async () => {
    await driver.get(`${urls.indoorMapOverlay}#id=geoMap&nodeId=172.16.177.33`);
    const canvas = await getElementByCss(driver, "canvas", 2000);
    const indoorContainer = await getElementByCss(driver, ".njg-popup-button", 2000);
    const node = await getElementByXpath(
      driver,
      "//span[@class='njg-tooltip-value' and text()='172.16.177.33']",
      2000,
    );
    const nodeId = await node.getAttribute("textContent");
    const consoleErrors = await captureConsoleErrors(driver);
    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
    expect(canvas).not.toBeNull();
    expect(indoorContainer).not.toBeNull();
    expect(nodeId).toBe("172.16.177.33");
  });

  test("nodePopup toggles tooltip suppression while popup is open", async () => {
    await driver.get(urls.indoorMapOverlay);
    const canvas = await getElementByCss(driver, "canvas", 2000);
    expect(canvas).not.toBeNull();
    await driver.executeScript('window._geoMap.utils.triggerOnClick("172.16.171.15");');
    const popupCloseBtn = await getElementByCss(
      driver,
      ".leaflet-popup-close-button",
      2000,
    );
    expect(popupCloseBtn).not.toBeNull();
    let tooltipSuppressed = await driver.executeScript(
      'return window._geoMap.el.classList.contains("njg-hide-tooltip");',
    );
    expect(tooltipSuppressed).toBe(true);
    await driver.executeScript("arguments[0].click();", popupCloseBtn);
    tooltipSuppressed = await driver.executeScript(
      'return window._geoMap.el.classList.contains("njg-hide-tooltip");',
    );
    expect(tooltipSuppressed).toBe(false);
  });

  test("bookmarkableActions: test forward/backward actions", async () => {
    await driver.get(urls.indoorMapOverlay);
    const canvas = await getElementByCss(driver, "canvas", 2000);
    expect(canvas).not.toBeNull();
    await driver.executeScript('window._geoMap.utils.triggerOnClick("172.16.171.15");');
    let currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain("172.16.171.15");
    let node = await getElementByXpath(
      driver,
      "//span[@class='njg-tooltip-value' and text()='172.16.171.15']",
      2000,
    );
    let nodeId = await node.getAttribute("textContent");
    expect(nodeId).toBe("172.16.171.15");
    const floorplanBtn = await getElementByCss(driver, ".njg-popup-button", 2000);
    expect(floorplanBtn).not.toBeNull();
    await driver.executeScript("arguments[0].click();", floorplanBtn);
    // wait for overlay to open and render indoor map
    await driver.sleep(500);
    let indoorContainer = await getElementByCss(driver, "#indoormap-container", 2000);
    expect(indoorContainer).not.toBeNull();
    await driver.executeScript('window._indoorMap.utils.triggerOnClick("node_2");');
    currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain("node_2");
    await driver.get("http://0.0.0.0:8080");
    await driver.sleep(500);
    await driver.navigate().back();
    await driver.sleep(500);
    currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain("172.16.171.15");
    expect(currentUrl).toContain("node_2");
    indoorContainer = await getElementByCss(driver, "#indoormap-container");
    expect(indoorContainer).not.toBeNull();
    node = await getElementByXpath(
      driver,
      "//span[@class='njg-tooltip-value' and text()='Node 2']",
      2000,
    );
    nodeId = await node.getAttribute("textContent");
    expect(nodeId).toBe("Node 2");
    await driver.navigate().back();
    await driver.sleep(500);
    currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain("172.16.171.15");
    expect(currentUrl).not.toContain("node_2");
    indoorContainer = await getElementByCss(driver, "#indoormap-container");
    // The overlay-open state is a dedicated history entry.
    // Back from the indoor node selection clears node_2 but keeps the overlay open.
    expect(indoorContainer).not.toBeNull();
    node = await getElementByXpath(
      driver,
      "//span[@class='njg-tooltip-value' and text()='172.16.171.15']",
      2000,
    );
    nodeId = await node.getAttribute("textContent");
    expect(nodeId).toBe("172.16.171.15");

    // Back again should close the overlay (no indoorMap fragment).
    await driver.navigate().back();
    await driver.sleep(500);
    currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain("172.16.171.15");
    expect(currentUrl).not.toContain("node_2");
    indoorContainer = await getElementByCss(driver, "#indoormap-container");
    expect(indoorContainer).toBeNull();
    node = await getElementByXpath(
      driver,
      "//span[@class='njg-tooltip-value' and text()='172.16.171.15']",
      2000,
    );
    expect(await node.getAttribute("textContent")).toBe("172.16.171.15");
    await driver.navigate().forward();
    await driver.sleep(500);
    currentUrl = await driver.getCurrentUrl();
    // Forward should reopen the overlay-open state (no node selected).
    expect(currentUrl).toContain("172.16.171.15");
    expect(currentUrl).not.toContain("node_2");
    indoorContainer = await getElementByCss(driver, "#indoormap-container");
    expect(indoorContainer).not.toBeNull();
    node = await getElementByXpath(
      driver,
      "//span[@class='njg-tooltip-value' and text()='172.16.171.15']",
      2000,
    );
    expect(await node.getAttribute("textContent")).toBe("172.16.171.15");

    // Forward again should restore the indoor node selection.
    await driver.navigate().forward();
    await driver.sleep(500);
    currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toContain("172.16.171.15");
    expect(currentUrl).toContain("node_2");
    indoorContainer = await getElementByCss(driver, "#indoormap-container");
    expect(indoorContainer).not.toBeNull();
    node = await getElementByXpath(
      driver,
      "//span[@class='njg-tooltip-value' and text()='Node 2']",
      2000,
    );
    nodeId = await node.getAttribute("textContent");
    expect(nodeId).toBe("Node 2");
    const consoleErrors = await captureConsoleErrors(driver);
    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
  }, 10000); // This test needs more time

  test("bookmarkableActions: check if parseUrlFragments handles invalid UTF-8", async () => {
    // Invalid UTF-8 sequence in hash
    await driver.get(`${urls.indoorMapOverlay}#%E2%82`);
    const canvas = await getElementByCss(driver, "canvas", 2000);
    const consoleErrors = await captureConsoleErrors(driver);
    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
    expect(canvas).not.toBeNull();
  });
  test("Regression: Labels should hide when zoomed out below showMapLabelsAtZoom", async () => {
    await driver.get(urls.geographicMap);
    await getElementByCss(driver, ".ec-extension-leaflet", 2000);

    // FIX: Removed 'async' and 'await' to satisfy linter
    await driver.wait(
      () => driver.executeScript("return typeof window.map !== 'undefined'"),
      5000,
      "Timed out waiting for window.map to initialize",
    );

    await driver.executeScript(`
      window.map.config.showMapLabelsAtZoom = 12;
      window.map.leaflet.setZoom(13);
    `);
    await driver.sleep(500);
    let isVisible = await driver.executeScript(
      "return window.map.echarts.getOption().series[0].label.show;",
    );
    expect(isVisible).toBe(true);
    await driver.executeScript("window.map.leaflet.setZoom(10);");
    await driver.sleep(500);
    isVisible = await driver.executeScript(
      "return window.map.echarts.getOption().series[0].label.show;",
    );
    expect(isVisible).toBe(false);
  });

  test("emphasis labels follow tooltip configuration", async () => {
    await driver.manage().window().setRect({width: 1200, height: 800});
    try {
      await driver.get(urls.geographicMap);
      await getElementByCss(driver, ".ec-extension-leaflet", 2000);
      await driver.wait(
        () => driver.executeScript("return typeof window.map !== 'undefined'"),
        5000,
        "Timed out waiting for window.map to initialize",
      );
      await driver.executeScript(`
        window.map.config.showMapLabelsAtZoom = 12;
        window.map.leaflet.setZoom(13);
        window.map.utils.updateLabelVisibility(window.map, true);
      `);
      await driver.sleep(500);
      let emphasisShow = await driver.executeScript(
        "return window.map.echarts.getOption().series[0].emphasis.label.show;",
      );
      expect(emphasisShow).toBe(false);
      await driver.manage().window().setRect({width: 800, height: 600});
      await driver.sleep(500);
      await driver.executeScript(`
        window.map.utils.updateLabelVisibility(window.map, true);
      `);
      await driver.sleep(500);
      emphasisShow = await driver.executeScript(
        "return window.map.echarts.getOption().series[0].emphasis.label.show;",
      );
      expect(emphasisShow).toBe(true);
    } finally {
      await driver.manage().window().setRect({width: 1200, height: 800});
    }
  });

  test("moveNodeInRealTime: test in Geographic map example", async () => {
    await driver.get(urls.geographicMap);
    const canvas = await getElementByCss(driver, "canvas", 2000);
    expect(canvas).not.toBeNull();
    await driver.executeScript(() => {
      window.map.utils.moveNodeInRealTime("172.16.171.15", {
        lat: 41.90197,
        lng: 12.49071,
      });
    });
    await driver.sleep(500);
    const coordinate = await driver.executeScript(() => {
      const options = window.map.echarts.getOption();
      const series = options.series.find((s) => s.type === "scatter");
      const location = series.data.find((l) => l.name === "Germany-2");
      return location.value;
    });
    expect(coordinate).toEqual([12.49071, 41.90197]);
    const consoleErrors = await captureConsoleErrors(driver);
    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
  });

  test("moveNodeInRealTime: render example without console errors", async () => {
    await driver.get(urls.movingNode);
    const leafletContainer = await getElementByCss(
      driver,
      ".ec-extension-leaflet",
      2000,
    );
    expect(leafletContainer).not.toBeNull();
    const canvas = await getElementByCss(driver, "canvas", 2000);
    expect(canvas).not.toBeNull();

    // Wait for map to initialize and get initial position
    await driver.sleep(500);
    const initialPosition = await driver.executeScript(() => {
      const options = window.map.echarts.getOption();
      const series = options.series.find((s) => s.type === "scatter");
      const node = series.data.find((l) => l.name === "Bus 141 Rome");
      return node ? node.value : null;
    });
    expect(initialPosition).not.toBeNull();
    expect(Array.isArray(initialPosition)).toBe(true);
    expect(initialPosition).toHaveLength(2);

    // Wait for at least one movement cycle (2 seconds per movement)
    await driver.sleep(2500);

    // Get new position after movement
    const newPosition = await driver.executeScript(() => {
      const options = window.map.echarts.getOption();
      const series = options.series.find((s) => s.type === "scatter");
      const node = series.data.find((l) => l.name === "Bus 141 Rome");
      return node ? node.value : null;
    });
    expect(newPosition).not.toBeNull();
    expect(Array.isArray(newPosition)).toBe(true);
    expect(newPosition).toHaveLength(2);
    // Verify the position has changed
    expect(newPosition).not.toEqual(initialPosition);

    // Check for console errors
    const consoleErrors = await captureConsoleErrors(driver);
    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
  });

  test("graph: zoom works when scrolling on empty container area", async () => {
    await driver.get(urls.basicUsage);
    await getElementByCss(driver, "canvas", 2000);
    const zoomChanged = await driver.executeAsyncScript(`
      const done = arguments[arguments.length - 1];
      const option = graph.echarts.getOption();
      const initialZoom = option?.series?.[0]?.zoom ?? 1;

      const dom = graph.echarts.getDom();
      const zr = graph.echarts.getZr();
      const canvas = zr && zr.dom;
      if (!dom || !canvas) return done(false);

      const containerRect = dom.getBoundingClientRect();
      const canvasRect = canvas.getBoundingClientRect();    

      const x = (canvasRect.right + containerRect.right) / 2;
      const y = (canvasRect.bottom + containerRect.bottom) / 2;    
    
      dom.dispatchEvent(new WheelEvent('wheel', {
        bubbles: true,
        clientX: x,
        clientY: y,
        deltaY: -120,
        deltaMode: 0
      }));
      const start = Date.now();
      (function poll() {
        const option = graph.echarts.getOption();
        const newZoom = (option && option.series && option.series[0] && option.series[0].zoom) || 1;
        if (newZoom !== initialZoom) return done(true);
        if (Date.now() - start > 2000) return done(false);
        setTimeout(poll, 50);
      }());
    `);
    expect(zoomChanged).toBe(true);
  });

  test("clustering: renders without errors and works correctly on zoom", async () => {
    await driver.get(urls.clustering);
    // Wait for map to load
    const leafletContainer = await getElementByCss(
      driver,
      ".ec-extension-leaflet",
      2000,
    );
    // check for presence of legend and canvas
    const legend = await getElementByCss(driver, "#legend", 2000);
    const canvases = await getElementsByCss(
      driver,
      ".ec-extension-leaflet .leaflet-overlay-pane canvas",
    );
    expect(leafletContainer).not.toBeNull();
    expect(legend).not.toBeNull();
    expect(canvases.length).toBeGreaterThan(0);
    // Get initial node count at low zoom (should have fewer nodes due to clustering)
    const initialNodeCount = await driver.executeScript(`
      const option = window.map.echarts.getOption();
      const series = option.series.find(s => s.type === 'scatter');
      return series ? series.data.length : 0;
    `);
    // Zoom in to disable clustering (at higher zoom levels)
    const zoomIn = await getElementByCss(driver, ".leaflet-control-zoom-in", 2000);
    let click = 0;
    while (click < 10) {
      // eslint-disable-next-line no-await-in-loop
      const className = await zoomIn.getAttribute("class");
      if (className.includes("leaflet-disabled")) {
        break;
      }
      zoomIn.click();
      click += 1;
    }
    await driver.sleep(1000); // Wait for clustering to update
    // Get node count at high zoom (should have more nodes when clustering is disabled)
    const finalNodeCount = await driver.executeScript(`
      const option = window.map.echarts.getOption();
      const series = option.series.find(s => s.type === 'scatter');
      return series ? series.data.length : 0;
    `);
    const consoleErrors = await captureConsoleErrors(driver);
    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
    // At high zoom, we should see more individual nodes (clustering disabled)
    // At low zoom, we should see fewer nodes (clustering enabled)
    expect(finalNodeCount).toBeGreaterThan(initialNodeCount);
    // Verify that we have a reasonable number of nodes
    // The clustering data has multiple nodes at same coordinates
    // so finalNodeCount should be significantly higher when unclustered
    expect(finalNodeCount).toBeGreaterThan(5);
    expect(initialNodeCount).toBeGreaterThan(0);
  });

  test("GeoJSON: polygons are hidden while they belong to a cluster", async () => {
    await driver.get(urls.geoJson);
    await driver.wait(
      () =>
        driver.executeScript(
          "return Boolean(window.map && window.map.leaflet && window.map.leaflet.polygonGeoJSON);",
        ),
      5000,
      "Timed out waiting for the polygons to be drawn",
    );
    const getPolygons = async (zoom) => {
      // Without animation the clusters are redrawn before setZoom returns
      await driver.executeScript(
        "window.map.leaflet.setZoom(arguments[0], {animate: false});",
        zoom,
      );
      await driver.wait(
        () =>
          driver.executeScript(
            "return window.map.leaflet.getZoom() === arguments[0];",
            zoom,
          ),
        5000,
        `Timed out waiting for zoom ${zoom}`,
      );
      return driver.executeScript(`
        const {leaflet, echarts, data} = window.map;
        const name = (properties) => properties.country || properties.name;
        const series = echarts.getOption().series.find((s) => s.type === "scatter");
        const clusteredIds = new Set();
        series.data
          .filter((item) => item.cluster)
          .forEach((cluster) => cluster.childNodes.forEach((n) => clusteredIds.add(n.id)));
        const nodes = data.nodes.filter((n) => n.properties._featureType === "Polygon");
        const hidden = [];
        const shown = [];
        leaflet.polygonGeoJSON.eachLayer((layer) =>
          (leaflet.hasLayer(layer) ? shown : hidden).push(name(layer.feature.properties)),
        );
        return {
          nodes: nodes.map((n) => name(n.properties)),
          clustered: nodes.filter((n) => clusteredIds.has(n.id)).map((n) => name(n.properties)),
          hidden,
          shown,
        };
      `);
    };
    // At the lowest zoom the polygon of Austria is close to the points around
    // it, while the MultiPolygon is far from any other feature.
    const zoomedOut = await getPolygons(3);
    // The MultiPolygon is represented by a single node
    expect(zoomedOut.nodes).toEqual(["Austria", "Sample MultiPolygon"]);
    expect(zoomedOut.clustered).toEqual(["Austria"]);
    expect(zoomedOut.hidden).toEqual(["Austria"]);
    expect(zoomedOut.shown).toEqual(["Sample MultiPolygon"]);
    // Above disableClusteringAtLevel nothing is clustered
    const zoomedIn = await getPolygons(7);
    expect(zoomedIn.clustered).toEqual([]);
    expect(zoomedIn.hidden).toEqual([]);
    expect(zoomedIn.shown).toEqual(["Austria", "Sample MultiPolygon"]);
    const consoleErrors = await captureConsoleErrors(driver);
    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
  });

  test.each([1200, 800])(
    "GeoJSON: polygon hover follows point controls at width %i",
    async (width) => {
      await driver.manage().window().setRect({width, height: 800});
      try {
        await driver.get(urls.geoJson);
        await driver.wait(
          () =>
            driver.executeScript(
              "return Boolean(window.map?.leaflet?.polygonGeoJSON);",
            ),
          5000,
          "Timed out waiting for polygon overlays",
        );
        const label = await driver.executeScript(`
        const {leaflet, data} = window.map;
        const node = data.nodes.find((n) => n.properties.country === "Austria");
        leaflet.setView([node.location.lat, node.location.lng], 7, {animate: false});
        window.map.config.showMapLabelsAtZoom = 13;
        window.map.utils.updateLabelVisibility(window.map, true);
        return node.label || node.id;
      `);
        const container = await getElementByCss(driver, ".ec-extension-leaflet", 2000);
        await driver.actions().move({origin: container, x: 20, y: 0}).perform();
        const hoverState = () =>
          driver.executeScript(
            `
        const {echarts} = window.map;
        const tooltip = document.querySelector(".njg-tooltip");
        return {
          tooltip: Boolean(tooltip && getComputedStyle(tooltip).visibility !== "hidden" &&
            getComputedStyle(tooltip).display !== "none" && tooltip.textContent.includes("Austria")),
          label: echarts.getZr().storage.getDisplayList().some(
            (element) => element.type === "tspan" && element.style.text === arguments[0] && !element.ignore,
          ),
        };
      `,
            label,
          );
        await driver.wait(
          async () => {
            const state = await hoverState();
            return width > 850 ? state.tooltip : state.label;
          },
          5000,
          "Hovering the polygon should show the same tooltip or label as a point",
        );
        expect(await hoverState()).toEqual({tooltip: width > 850, label: width <= 850});
        await driver.actions().move({origin: container, x: 250, y: 0}).perform();
        await driver.wait(
          async () => {
            const state = await hoverState();
            return !state.tooltip && !state.label;
          },
          5000,
          "Polygon hover information should disappear on mouseout",
        );
        await driver.executeScript(`
        window.map.config.showMapLabelsAtZoom = false;
        window.map.echarts.setOption({
          tooltip: {show: false},
          media: [{query: {minWidth: 0}, option: {tooltip: {show: false}}}],
        });
        window.map.utils.updateLabelVisibility(window.map, true);
      `);
        expect(
          await driver.executeScript(
            "return window.map.echarts.getOption().tooltip[0].show;",
          ),
        ).toBe(false);
        await driver.actions().move({origin: container, x: 20, y: 0}).perform();
        await driver.wait(
          async () => {
            const state = await hoverState();
            return !state.tooltip && !state.label;
          },
          5000,
          "Disabled polygon labels and tooltips should stay hidden",
        );
      } finally {
        await driver.manage().window().setRect({width: 1200, height: 800});
      }
    },
  );

  test("GeoJSON: clicking a polygon opens its popup and adds it to the URL", async () => {
    await driver.get(urls.geoJson);
    await driver.wait(
      () =>
        driver.executeScript(
          "return Boolean(window.map && window.map.leaflet && window.map.leaflet.polygonGeoJSON);",
        ),
      5000,
      "Timed out waiting for the polygons to be drawn",
    );
    // Center the map on the node of the polygon, which lies within the
    // polygon, at a zoom level at which nothing is clustered.
    const nodeId = await driver.executeScript(`
      const {leaflet, data} = window.map;
      const node = data.nodes.find((n) => n.properties._featureType === "Polygon");
      leaflet.setView([node.location.lat, node.location.lng], 7, {animate: false});
      const onClick = window.map.config.onClickElement;
      window.polygonClicks = [];
      window.map.config.onClickElement = function(type, data) {
        window.polygonClicks.push({type, data});
        onClick.call(this, type, data);
      };
      return node.id;
    `);
    await driver.wait(
      () =>
        driver.executeScript(
          `const {leaflet, polygonNodes} = window.map;
          return leaflet.getZoom() === 7 && leaflet.polygonGeoJSON.getLayers().some(
            (layer) => leaflet.hasLayer(layer) && polygonNodes.get(layer.feature).id === arguments[0],
          );`,
          nodeId,
        ),
      5000,
      "Timed out waiting for the polygon to be shown at zoom 7",
    );
    const container = await getElementByCss(driver, ".ec-extension-leaflet", 2000);
    await driver.actions().move({origin: container}).click().perform();
    const popup = await getElementByCss(driver, ".leaflet-popup", 2000);
    expect(popup).not.toBeNull();
    expect(await driver.executeScript("return window.polygonClicks;")).toEqual([
      {type: "Feature", data: {country: "Austria"}},
    ]);
    expect(await driver.getCurrentUrl()).toContain(`nodeId=${nodeId}`);
    // The popup of the polygon is restored when the page is loaded again
    await driver.navigate().refresh();
    const restoredPopup = await getElementByCss(driver, ".leaflet-popup", 5000);
    expect(restoredPopup).not.toBeNull();
    expect(await driver.getCurrentUrl()).toContain(`nodeId=${nodeId}`);
    const consoleErrors = await captureConsoleErrors(driver);
    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
  }, 10000); // This test needs more time

  test("renders Leaflet plugins and captures measurement clicks across the map", async () => {
    await driver.manage().window().setSize(1280, 800);
    await driver.get(urls.leafletPlugins);
    const leafletContainer = await getElementByCss(
      driver,
      ".ec-extension-leaflet",
      2000,
    );
    const drawToolbar = await getElementByCss(driver, ".leaflet-draw-toolbar", 2000);
    const drawSection = await getElementByCss(driver, ".leaflet-draw-section", 2000);
    const drawPolylineBtn = await getElementByCss(
      driver,
      ".leaflet-draw-draw-polyline",
      2000,
    );
    const measureControl = await getElementByCss(
      driver,
      ".leaflet-control-measure",
      2000,
    );
    const consoleErrors = await captureConsoleErrors(driver);
    printConsoleErrors(consoleErrors);
    expect(consoleErrors.length).toBe(0);
    expect(leafletContainer).not.toBeNull();
    expect(drawToolbar).not.toBeNull();
    expect(drawSection).not.toBeNull();
    expect(drawPolylineBtn).not.toBeNull();
    expect(measureControl).not.toBeNull();

    await driver.wait(until.elementIsVisible(measureControl), 2000);
    await driver.actions().move({origin: measureControl}).perform();
    const startMeasure = await getElementByCss(
      driver,
      ".leaflet-control-measure .js-start",
      2000,
    );
    await driver.wait(
      until.elementIsVisible(startMeasure),
      2000,
      "Start measurement link did not become visible after expanding the control",
    );
    await driver.wait(until.elementIsEnabled(startMeasure), 2000);
    await startMeasure.click();

    const mapBounds = await driver.executeScript(`
      const map = document.querySelector(".leaflet-container");
      const {left, top, width, height} = map.getBoundingClientRect();
      const sidebar = document.querySelector(".njg-sideBar:not(.hidden)");
      const visibleLeft = sidebar
        ? Math.max(left, sidebar.getBoundingClientRect().right)
        : left;
      const visibleWidth = left + width - visibleLeft;
      const captureMarker = Array.from(map.querySelectorAll(".leaflet-marker-icon")).find(
        (marker) => marker.style.opacity === "0",
      );
      const measurementPoints = [
        [0.2, 0.2],
        [0.75, 0.45],
        [0.75, 0.65],
      ];
      const captureHits = measurementPoints.map(([xRatio, yRatio]) => {
        const clientX = Math.round(visibleLeft + visibleWidth * xRatio);
        const clientY = Math.round(top + height * yRatio);
        const target = document.elementFromPoint(clientX, clientY);
        return (
          captureMarker && (target === captureMarker || captureMarker.contains(target))
        );
      });
      const edgeTarget = document.elementFromPoint(
        Math.round(visibleLeft + 5),
        Math.round(top + height / 2),
      );
      const edgeCaptureHit =
        captureMarker &&
        (edgeTarget === captureMarker || captureMarker.contains(edgeTarget));
      return {
        left,
        top,
        width,
        height,
        visibleLeft,
        visibleWidth,
        captureHits,
        edgeCaptureHit,
      };
    `);
    expect(mapBounds.captureHits).toEqual([true, true, true]);
    expect(mapBounds.edgeCaptureHit).toBe(true);
    const getMeasurementState = () =>
      driver.executeScript(`
        return {
          transform: getComputedStyle(document.querySelector(".leaflet-map-pane")).transform,
          results: document.querySelector(".leaflet-control-measure .js-results").textContent,
        };
      `);
    const clickMeasurementPoint = async (xRatio, yRatio) => {
      const clientX = Math.round(
        mapBounds.visibleLeft + mapBounds.visibleWidth * xRatio,
      );
      const clientY = Math.round(mapBounds.top + mapBounds.height * yRatio);
      await driver
        .actions()
        .move({origin: "viewport", x: clientX, y: clientY})
        .click()
        .perform();
      return {x: clientX, y: clientY};
    };
    const initialState = await getMeasurementState();
    const stateBeforeDrag = await getMeasurementState();
    const edgePoint = {
      x: Math.round(mapBounds.left + mapBounds.width - 5),
      y: Math.round(mapBounds.top + mapBounds.height / 2),
    };
    await driver.executeScript(`
      window.__measurementMoveEnded = false;
      window.map.leaflet.once("moveend", () => {
        window.__measurementMoveEnded = true;
      });
    `);
    await driver
      .actions()
      .move({origin: "viewport", ...edgePoint})
      .press()
      .move({origin: "pointer", x: -30, y: 0, duration: 250})
      .release()
      .perform();
    await driver.wait(
      async () => (await getMeasurementState()).transform !== initialState.transform,
      2000,
      "Dragging the map during measurement did not pan it",
    );
    await driver.wait(
      () => driver.executeScript("return window.__measurementMoveEnded"),
      5000,
      "Leaflet did not finish panning after the drag",
    );
    const stateAfterDrag = await getMeasurementState();
    expect(stateAfterDrag.results).toBe(stateBeforeDrag.results);
    const firstPoint = await clickMeasurementPoint(0.2, 0.2);
    const stateAfterFirstPoint = await getMeasurementState();
    expect(stateAfterFirstPoint.results).not.toBe(stateAfterDrag.results);
    expect(stateAfterFirstPoint.transform).toBe(stateAfterDrag.transform);
    await clickMeasurementPoint(0.75, 0.45);
    const stateAfterSecondPoint = await getMeasurementState();
    expect(stateAfterSecondPoint.results).not.toBe(stateAfterFirstPoint.results);
    expect(stateAfterSecondPoint.transform).toBe(stateAfterDrag.transform);

    await clickMeasurementPoint(0.75, 0.65);
    const stateAfterThirdPoint = await getMeasurementState();
    expect(stateAfterThirdPoint.results).toContain("Area");
    expect(stateAfterThirdPoint.transform).toBe(stateAfterDrag.transform);
    const activeAreaFill = await driver.executeScript(
      'return getComputedStyle(document.querySelector(".layer-measurearea")).fill',
    );
    expect(activeAreaFill).toBe("rgb(245, 124, 0)");
    await driver
      .actions()
      .move({origin: "viewport", ...firstPoint})
      .click()
      .perform();
    const completedArea = await driver.executeScript(`
      const popup = document.querySelector(".leaflet-measure-resultpopup");
      const area = document.querySelector(".layer-measure-resultarea");
      return {
        popupText: popup && popup.textContent,
        resultRows: popup
          ? Array.from(
              popup.querySelectorAll(".measure-result-row"),
              (row) => ({
                label: row.querySelector("strong").textContent.trim(),
                value: row.querySelector("span").textContent.trim(),
              }),
            )
          : [],
        popupPadding:
          popup &&
          getComputedStyle(
            popup.querySelector(".leaflet-popup-content"),
          ).padding,
        popupMargin:
          popup &&
          getComputedStyle(
            popup.querySelector(".leaflet-popup-content"),
          ).margin,
        popupBounds: popup && (() => {
          const {left, top, width, height} = popup.getBoundingClientRect();
          return {
            x: Math.round(left + width / 2),
            y: Math.round(top + height / 2),
          };
        })(),
        areaFill: area && getComputedStyle(area).fill,
      };
    `);
    if (completedArea.popupText === null) {
      throw new Error("Closing the area did not open its result popup");
    }
    expect(completedArea.popupText).toContain("Area measurement");
    expect(completedArea.resultRows.map((row) => row.label)).toEqual([
      "Area",
      "Perimeter",
    ]);
    expect(completedArea.resultRows.every((row) => row.value.length > 0)).toBe(true);
    expect(completedArea.popupPadding).toBe("12px 18px");
    expect(completedArea.popupMargin).toBe("0px");
    expect(completedArea.areaFill).toBe("rgb(245, 124, 0)");

    const verticesBeforeNextMeasurement = await driver.executeScript(
      'return document.querySelectorAll(".layer-measurevertex").length',
    );
    await driver.executeScript(
      'document.querySelector(".leaflet-control-measure .js-start").click()',
    );
    await driver.wait(
      () =>
        driver.executeScript(
          'return document.querySelector(".leaflet-measure-resultpopup") === null',
        ),
      2000,
      "Starting a new measurement did not close the previous result popup",
    );
    await driver
      .actions()
      .move({origin: "viewport", ...completedArea.popupBounds})
      .click()
      .perform();
    await driver.wait(
      () =>
        driver
          .executeScript(
            'return document.querySelectorAll(".layer-measurevertex").length',
          )
          .then((count) => count === verticesBeforeNextMeasurement + 1),
      2000,
      "Clicking the previous popup location did not add a measurement point",
    );
  }, 60000);

  test("touch taps add a measurement point without panning the map", async () => {
    const touchDriver = await getDriver({mobileEmulation: true});
    try {
      await touchDriver.get(urls.leafletPlugins);
      await touchDriver.wait(
        until.elementLocated(By.css(".leaflet-control-measure .js-start")),
        5000,
      );
      await touchDriver.executeScript(
        'document.querySelector(".leaflet-control-measure .js-start").click()',
      );

      const touchStateBefore = await touchDriver.executeScript(`
        const map = document.querySelector(".leaflet-container");
        const {left, top, width, height} = map.getBoundingClientRect();
        return {
          x: Math.round(left + width / 2),
          y: Math.round(top + height / 2),
          transform: getComputedStyle(
            document.querySelector(".leaflet-map-pane"),
          ).transform,
          vertexCount: document.querySelectorAll(".layer-measurevertex").length,
        };
      `);
      const finger = new Pointer("measurement touch", Pointer.Type.TOUCH);
      await touchDriver
        .actions()
        .insert(
          finger,
          finger.move({
            origin: Origin.VIEWPORT,
            x: touchStateBefore.x,
            y: touchStateBefore.y,
            duration: 0,
          }),
          finger.press(),
          finger.release(),
        )
        .perform();
      await touchDriver.wait(
        async () =>
          (await touchDriver.executeScript(
            'return document.querySelectorAll(".layer-measurevertex").length',
          )) ===
          touchStateBefore.vertexCount + 1,
        5000,
        "Touch tap did not add a measurement point",
      );
      const touchStateAfter = await touchDriver.executeScript(`
        return {
          transform: getComputedStyle(
            document.querySelector(".leaflet-map-pane"),
          ).transform,
          vertexCount: document.querySelectorAll(".layer-measurevertex").length,
        };
      `);
      expect(touchStateAfter.vertexCount).toBe(touchStateBefore.vertexCount + 1);
      expect(touchStateAfter.transform).toBe(touchStateBefore.transform);
    } finally {
      await tearDown(touchDriver);
    }
  }, 30000);

  test("node popups fit their content and narrow map containers", async () => {
    await driver.get(urls.indoorMapOverlay);
    expect(await getElementByCss(driver, ".leaflet-container", 5000)).not.toBeNull();
    await driver.executeScript(`
      const leafletStyles = document.createElement("style");
      leafletStyles.textContent = ".leaflet-popup-content { margin: 13px 24px 13px 20px; } .leaflet-popup-content-wrapper { padding: 1px; }";
      document.head.appendChild(leafletStyles);
    `);
    const measurePopup = async (width) =>
      driver.executeScript(
        `
        const mapWidth = arguments[0];
        const container = document.querySelector(".njg-container");
        container.style.width = mapWidth + "px";
        window._geoMap.echarts.resize();
        window._geoMap.leaflet.invalidateSize();
        return window._geoMap.gui.loadNodePopup({
          name: "Node 9",
          id: "node_9",
          label: "Node 9",
          location: {lat: 0.10986321, lng: -1.15356445},
        }).then(() => {
        const popup = window._geoMap.leaflet.currentPopup.getElement();
        const rows = [...popup.querySelectorAll(".njg-tooltip-item")];
          return {
          width: popup.getBoundingClientRect().width,
          mapWidth: window._geoMap.leaflet.getSize().x,
          labelHeight: rows[0].querySelector(".njg-tooltip-key").getBoundingClientRect()
            .height,
          valueHeight: rows[0]
            .querySelector(".njg-tooltip-value")
            .getBoundingClientRect().height,
          };
        });
      `,
        width,
      );
    const wide = await measurePopup(800);
    expect(wide.width).toBeGreaterThanOrEqual(200);
    expect(wide.width).toBeLessThanOrEqual(320);
    expect(wide.labelHeight).toBeLessThan(22);
    expect(wide.valueHeight).toBeLessThan(22);
    const narrow = await measurePopup(180);
    expect(narrow.mapWidth).toBe(180);
    expect(narrow.width).toBeLessThanOrEqual(180);
    const custom = await driver.executeScript(`
      const graph = window._geoMap;
      graph.config.mapOptions.nodePopup.content = () => "Hello world";
      return graph.gui.loadNodePopup(graph.data.nodes[0]).then(() => {
        const popup = graph.leaflet.currentPopup.getElement();
        const range = document.createRange();
        range.selectNodeContents(popup.querySelector(".leaflet-popup-content"));
        const text = range.getBoundingClientRect();
        const close = popup.querySelector(".leaflet-popup-close-button").getBoundingClientRect();
        return {overlap: text.left < close.right && text.right > close.left && text.top < close.bottom && text.bottom > close.top, width: popup.getBoundingClientRect().width};
      });
    `);
    expect(custom.overlap).toBe(false);
    expect(custom.width).toBeLessThanOrEqual(180);
  });

  test("hover tooltip fits its content and narrow map containers", async () => {
    await driver.manage().window().setRect({width: 1200, height: 800});
    await driver.get(urls.clustering);
    await driver.wait(
      () =>
        driver.executeScript(
          "return Boolean(window.map && window.map.leaflet && window.map.data);",
        ),
      5000,
      "Cluster map was not ready",
    );
    await driver.executeScript(`
      const node = window.map.data.nodes.find((item) => item.properties.name === "Critical Node 23");
      window.map.leaflet.setView([node.location.lat, node.location.lng], 18, {animate: false});
    `);
    const measure = async (width) =>
      driver.executeScript(
        `
        const container = document.querySelector(".njg-container");
        container.style.width = arguments[0] + "px";
        window.map.echarts.resize();
        window.map.echarts.setOption({tooltip: {show: true}, media: [{query: {minWidth: 0}, option: {tooltip: {show: true}}}]});
        const series = window.map.echarts.getOption().series;
        const seriesIndex = series.findIndex((item) => item.type === "scatter" && item.data.some((point) => point.node && point.node.properties.name === "Critical Node 23"));
        const dataIndex = series[seriesIndex].data.findIndex((point) => point.node && point.node.properties.name === "Critical Node 23");
        window.map.echarts.dispatchAction({type: "showTip", seriesIndex, dataIndex});
        const tooltip = container.querySelector(".njg-tooltip");
        tooltip.style.maxWidth = "";
        if (arguments[0] === 180) {
          tooltip.querySelector(".njg-tooltip-inner").appendChild(window.map.utils.createTooltipItem("longValue", "x".repeat(200)));
          tooltip.querySelector(".njg-tooltip-inner").appendChild(window.map.utils.createTooltipItem("a_very_long_property_name_that_has_no_natural_breaks", "Readable value"));
        }
        const rows = [...tooltip.querySelectorAll(".njg-tooltip-item")];
        const label = rows.find((item) => item.querySelector(".njg-tooltip-key").textContent === "label");
        const country = rows.find((item) => item.querySelector(".njg-tooltip-key").textContent === "country");
        const labelValue = label.querySelector(".njg-tooltip-value").getBoundingClientRect();
        const key = country.querySelector(".njg-tooltip-key").getBoundingClientRect();
        const value = country.querySelector(".njg-tooltip-value").getBoundingClientRect();
        const longKeyRow = rows.find((item) => item.querySelector(".njg-tooltip-key").textContent === "a_very_long_property_name_that_has_no_natural_breaks");
        const longKeyValueWidth = longKeyRow && longKeyRow.querySelector(".njg-tooltip-value").getBoundingClientRect().width;
        const width = tooltip.getBoundingClientRect().width;
        tooltip.style.maxWidth = "none";
        const unconstrainedWidth = tooltip.getBoundingClientRect().width;
        tooltip.style.maxWidth = "";
        return {width, unconstrainedWidth, valueHeight: labelValue.height, gap: value.left - key.right, longKeyValueWidth};
      `,
        width,
      );
    const wide = await measure(800);
    expect(wide.valueHeight).toBeLessThanOrEqual(22);
    expect(wide.gap).toBeGreaterThanOrEqual(4);
    expect(wide.width).toBeLessThanOrEqual(320);
    const narrow = await measure(180);
    expect(narrow.width).toBeLessThanOrEqual(180);
    expect(narrow.gap).toBeGreaterThanOrEqual(4);
    expect(narrow.longKeyValueWidth).toBeGreaterThanOrEqual(30);
    expect(narrow.unconstrainedWidth).toBeGreaterThan(180);
    await measure(800);
    const longKey = await driver.executeScript(`
      const tooltip = document.querySelector(".njg-tooltip");
      const row = window.map.utils.createTooltipItem("a_very_long_property_name_that_has_no_natural_breaks", "Readable value");
      tooltip.querySelector(".njg-tooltip-inner").appendChild(row);
      const keyElement = row.querySelector(".njg-tooltip-key");
      const key = keyElement.getBoundingClientRect();
      const value = row.querySelector(".njg-tooltip-value").getBoundingClientRect();
      const tooltipRect = tooltip.getBoundingClientRect();
      return {valueWidth: value.width, gap: value.left - key.right, overflow: value.right - tooltipRect.right, keyOverflow: keyElement.scrollWidth - keyElement.clientWidth};
    `);
    expect(longKey.valueWidth).toBeGreaterThanOrEqual(50);
    expect(longKey.gap).toBeGreaterThanOrEqual(4);
    expect(longKey.overflow).toBeLessThanOrEqual(0);
    expect(longKey.keyOverflow).toBeLessThanOrEqual(0);
    const multiline = await driver.executeScript(`
      const tooltip = document.querySelector(".njg-tooltip");
      const row = window.map.utils.createTooltipItem("addresses", "first\\nsecond");
      tooltip.querySelector(".njg-tooltip-inner").appendChild(row);
      const value = row.querySelector(".njg-tooltip-value");
      return {height: value.getBoundingClientRect().height, lineHeight: parseFloat(getComputedStyle(value).lineHeight)};
    `);
    expect(multiline.height).toBeGreaterThanOrEqual(multiline.lineHeight * 2);
    const shortKeys = await driver.executeScript(`
      const tooltip = document.querySelector(".njg-tooltip");
      const inner = tooltip.querySelector(".njg-tooltip-inner");
      const measure = (items) => {
        inner.replaceChildren(...items.map(([key, value]) => window.map.utils.createTooltipItem(key, value)));
        return [...inner.querySelectorAll(".njg-tooltip-item")].map((row) => {
          const key = row.querySelector(".njg-tooltip-key");
          const value = row.querySelector(".njg-tooltip-value");
          const keyRect = key.getBoundingClientRect();
          const valueRect = value.getBoundingClientRect();
          return {
            text: key.textContent,
            keyLines: Math.round(keyRect.height / parseFloat(getComputedStyle(key).lineHeight)),
            valueLines: Math.round(valueRect.height / parseFloat(getComputedStyle(value).lineHeight)),
            gap: valueRect.left - keyRect.right,
          };
        });
      };
      return [
        ...measure([["country", "Austria"]]),
        ...measure([["name", "Sample MultiLineString"], ["FeatureType", "LineString"]]),
      ];
    `);
    shortKeys.forEach(({text, keyLines, valueLines, gap}) => {
      expect({key: text, keyLines, valueLines}).toEqual({
        key: text,
        keyLines: 1,
        valueLines: 1,
      });
      expect(gap).toBeGreaterThanOrEqual(4);
    });
  });

  test("node popup points to the marker without covering it", async () => {
    await driver.manage().window().setRect({width: 1200, height: 800});
    await driver.get(urls.indoorMapOverlay);
    await driver.wait(
      () =>
        driver.executeScript(
          "return Boolean(window._geoMap && window._geoMap.leaflet && window._geoMap.data);",
        ),
      5000,
      "Map was not ready",
    );
    const position = await driver.executeScript(`
      const graph = window._geoMap;
      const node = graph.data.nodes.find((item) => item.id === "172.16.171.15");
      graph.leaflet.setView([node.location.lat, node.location.lng], 10, {animate: false});
      return graph.gui.loadNodePopup(node).then(() => {
        const popup = graph.leaflet.currentPopup;
        const point = graph.leaflet.latLngToContainerPoint(popup.getLatLng());
        const mapRect = graph.leaflet.getContainer().getBoundingClientRect();
        const tip = popup.getElement().querySelector(".leaflet-popup-tip");
        const tipRect = tip.getBoundingClientRect();
        const contentRect = popup.getElement().querySelector(".leaflet-popup-content-wrapper").getBoundingClientRect();
        return {
          markerX: mapRect.left + point.x,
          markerTop: mapRect.top + point.y - 8,
          tipX: tipRect.left + tipRect.width / 2,
          tipBottom: tipRect.bottom,
          contentBottom: contentRect.bottom,
          tipPointerEvents: getComputedStyle(tip).pointerEvents,
        };
      });
    `);
    expect(Math.abs(position.tipX - position.markerX)).toBeLessThanOrEqual(1);
    expect(position.tipBottom).toBeLessThanOrEqual(position.markerTop);
    expect(position.contentBottom).toBeLessThanOrEqual(position.markerTop);
    expect(position.tipPointerEvents).toBe("none");
  });

  test("GeoJSON point click keeps the popup open until the map is clicked", async () => {
    await driver.manage().window().setRect({width: 1400, height: 900});
    await driver.get(urls.geoJson);
    await driver.wait(
      () =>
        driver.executeScript(
          "return Boolean(window.map && window.map.leaflet && window.map.data);",
        ),
      5000,
      "GeoJSON map was not ready",
    );
    const nodeId = await driver.executeScript(`
      const node = window.map.data.nodes.find((item) => item.properties._featureType === "Point");
      window.map.leaflet.setView([node.location.lat, node.location.lng], 8, {animate: false});
      window.mapClickCount = 0;
      window.map.leaflet.on("click", () => { window.mapClickCount += 1; });
      return node.id;
    `);
    await driver.wait(
      () =>
        driver.executeScript(
          `
        return window.map.echarts.getOption().series.some((series) =>
          series.type === "scatter" && series.data.some((item) => item.node && item.node.id === arguments[0] && !item.cluster));
      `,
          nodeId,
        ),
      5000,
      "Point was not visible",
    );
    const container = await getElementByCss(driver, ".ec-extension-leaflet", 5000);
    await driver.actions().move({origin: container}).click().perform();
    await driver.sleep(300);
    expect(
      await driver.executeScript("return Boolean(window.map.leaflet.currentPopup);"),
    ).toBe(true);
    expect(await driver.getCurrentUrl()).toContain(`nodeId=${nodeId}`);
    expect(await driver.executeScript("return window.mapClickCount;")).toBe(1);
    await driver.actions().move({origin: container}).click().perform();
    await driver.wait(
      () => driver.executeScript("return Boolean(window.map.leaflet.currentPopup);"),
      5000,
      "Repeat click did not reopen the popup",
    );
    expect(await driver.getCurrentUrl()).toContain(`nodeId=${nodeId}`);
    expect(
      await driver.executeScript(
        "return window.map.activeHighlightedElements.map((item) => item.key);",
      ),
    ).toContain(`node:${nodeId}`);
    const secondId = await driver.executeScript(
      `
      const node = window.map.data.nodes.find((item) => item.properties._featureType === "Point" && item.id !== arguments[0]);
      window.map.leaflet.setView([node.location.lat, node.location.lng], 8, {animate: false});
      return node.id;
    `,
      nodeId,
    );
    await driver.wait(
      () =>
        driver.executeScript(
          `
        return window.map.echarts.getOption().series.some((series) =>
          series.type === "scatter" && series.data.some((item) => item.node && item.node.id === arguments[0] && !item.cluster));
      `,
          secondId,
        ),
      5000,
      "Second point was not visible",
    );
    const platform = (await driver.getCapabilities()).get("platformName");
    const modifier = platform === "mac" ? Key.COMMAND : Key.CONTROL;
    await driver
      .actions()
      .move({origin: container})
      .keyDown(modifier)
      .click()
      .keyUp(modifier)
      .perform();
    await driver.wait(
      () => driver.executeScript("return Boolean(window.map.leaflet.currentPopup);"),
      5000,
      "Second point did not open a popup",
    );
    expect(await driver.getCurrentUrl()).toContain(`nodeId=${secondId}`);
    expect(
      await driver.executeScript(
        "return window.map.activeHighlightedElements.map((item) => item.key);",
      ),
    ).toContain(`node:${secondId}`);
    expect(
      await driver.executeScript(
        "return window.map.activeHighlightedElements.map((item) => item.key);",
      ),
    ).toContain(`node:${nodeId}`);
    await driver.navigate().back();
    await driver.wait(
      async () => (await driver.getCurrentUrl()).includes(`nodeId=${nodeId}`),
      5000,
      "Back did not restore the previous node bookmark",
    );
    await driver.actions().move({origin: container, x: 300, y: 200}).click().perform();
    await driver.wait(
      () => driver.executeScript("return !window.map.leaflet.currentPopup;"),
      5000,
      "Clicking the map did not close the popup",
    );
    expect(await driver.executeScript("return window.mapClickCount;")).toBe(4);
  });

  test("touching a point opens its popup and releases map dragging", async () => {
    const touchDriver = await getDriver({mobileEmulation: true});
    try {
      await touchDriver.get(urls.geoJson);
      await touchDriver.wait(
        () =>
          touchDriver.executeScript(
            "return Boolean(window.map && window.map.leaflet && window.map.data);",
          ),
        5000,
        "GeoJSON map was not ready",
      );
      const point = await touchDriver.executeScript(`
        const node = window.map.data.nodes.find((item) => item.properties._featureType === "Point");
        window.map.gui.sideBar.classList.add("hidden");
        window.map.leaflet.setView([node.location.lat, node.location.lng], 8, {animate: false});
        window.touchEndCount = 0;
        window.mapClickCount = 0;
        window.map.leaflet.on("click", () => { window.mapClickCount += 1; });
        document.addEventListener("touchend", () => { window.touchEndCount += 1; });
        const rect = window.map.leaflet.getContainer().getBoundingClientRect();
        return {x: Math.round(rect.left + rect.width / 2), y: Math.round(rect.top + rect.height / 2)};
      `);
      const finger = new Pointer("node touch", Pointer.Type.TOUCH);
      await touchDriver
        .actions()
        .insert(
          finger,
          finger.move({origin: Origin.VIEWPORT, x: point.x, y: point.y, duration: 0}),
          finger.press(),
          finger.release(),
        )
        .perform();
      await touchDriver.sleep(400);
      const state = await touchDriver.executeScript(`
        return {
          popup: Boolean(window.map.leaflet.currentPopup),
          touchEndCount: window.touchEndCount,
          dragging: Boolean(window.L.Draggable._dragging),
          mapClickCount: window.mapClickCount,
        };
      `);
      expect(state).toEqual({
        popup: true,
        touchEndCount: 1,
        dragging: false,
        mapClickCount: 1,
      });
    } finally {
      await tearDown(touchDriver);
    }
  }, 30000);

  test("a failed older popup request cannot clear a newer point bookmark", async () => {
    await driver.get(urls.geoJson);
    await driver.wait(
      () =>
        driver.executeScript(
          "return Boolean(window.map && window.map.leaflet && window.map.data);",
        ),
      5000,
      "GeoJSON map was not ready",
    );
    const nodeId = await driver.executeScript(`
      const graph = window.map;
      const [first, second] = graph.data.nodes.filter((item) => item.properties._featureType === "Point");
      let rejectFirst;
      graph.config.mapOptions.nodePopup.content = () => new Promise((resolve, reject) => { rejectFirst = reject; });
      graph.gui.loadNodePopup(first);
      graph.config.mapOptions.nodePopup.content = () => "Second point";
      graph.echartsClickHandler({componentSubType: "scatter", seriesType: "scatter", data: {node: second}, seriesIndex: 0, dataIndex: 0});
      rejectFirst(new Error("old request failed"));
      return second.id;
    `);
    await driver.wait(
      () => driver.executeScript("return Boolean(window.map.leaflet.currentPopup);"),
      5000,
      "New popup did not open",
    );
    expect(await driver.getCurrentUrl()).toContain(`nodeId=${nodeId}`);
  });

  test("a deferred point popup does not replace a newer polygon popup", async () => {
    await driver.get(urls.geoJson);
    await driver.wait(
      () =>
        driver.executeScript(
          "return Boolean(window.map && window.map.leaflet && window.map.data);",
        ),
      5000,
      "GeoJSON map was not ready",
    );
    const polygonId = await driver.executeScript(`
      const graph = window.map;
      const point = graph.data.nodes.find((item) => item.properties._featureType === "Point");
      const polygon = graph.data.nodes.find((item) => item.properties._featureType === "Polygon");
      graph.config.mapOptions.nodePopup.content = (node) => node.id;
      graph.echartsClickHandler({componentSubType: "scatter", seriesType: "scatter", data: {node: point}, seriesIndex: 0, dataIndex: 0});
      graph.echartsClickHandler({componentSubType: "scatter", seriesType: "scatter", data: {node: polygon}, seriesIndex: 0, dataIndex: 0});
      return polygon.id;
    `);
    await driver.sleep(100);
    expect(
      await driver.executeScript(
        "return window.map.leaflet.currentPopup.getContent();",
      ),
    ).toBe(polygonId);
  });

  test("a deferred point popup does not replace a programmatically opened popup", async () => {
    await driver.get(urls.geoJson);
    await driver.wait(
      () =>
        driver.executeScript(
          "return Boolean(window.map && window.map.leaflet && window.map.data);",
        ),
      5000,
      "GeoJSON map was not ready",
    );
    const secondId = await driver.executeScript(`
      const graph = window.map;
      const [first, second] = graph.data.nodes.filter((item) => item.properties._featureType === "Point");
      graph.config.mapOptions.nodePopup.content = (node) => node.id;
      graph.config.onClickElement = () => graph.gui.loadNodePopup(second);
      graph.echartsClickHandler({componentSubType: "scatter", seriesType: "scatter", data: {node: first}, seriesIndex: 0, dataIndex: 0});
      return second.id;
    `);
    await driver.sleep(100);
    expect(
      await driver.executeScript(
        "return window.map.leaflet.currentPopup.getContent();",
      ),
    ).toBe(secondId);
  });

  test("browser navigation cancels a deferred point popup", async () => {
    await driver.get(urls.geoJson);
    await driver.wait(
      () =>
        driver.executeScript(
          "return Boolean(window.map && window.map.leaflet && window.map.data);",
        ),
      5000,
      "GeoJSON map was not ready",
    );
    await driver.executeScript(`
      const graph = window.map;
      const node = graph.data.nodes.find((item) => item.properties._featureType === "Point");
      graph.echartsClickHandler({componentSubType: "scatter", seriesType: "scatter", data: {node}, seriesIndex: 0, dataIndex: 0});
      window.history.replaceState({}, "", window.location.pathname);
      graph.utils.applyUrlFragmentState(graph);
    `);
    await driver.sleep(100);
    expect(
      await driver.executeScript("return Boolean(window.map.leaflet.currentPopup);"),
    ).toBe(false);
  });

  test("a failed popup request cannot clear a newer link bookmark", async () => {
    await driver.get(urls.geographicMap);
    await driver.wait(
      () =>
        driver.executeScript(
          "return Boolean(window.map && window.map.leaflet && window.map.data);",
        ),
      5000,
      "Map was not ready",
    );
    const result = await driver.executeAsyncScript(`
      const done = arguments[arguments.length - 1];
      const graph = window.map;
      const node = graph.data.nodes[0];
      const link = graph.data.links[0];
      let rejectFirst;
      graph.config.mapOptions.nodePopup.content = () => new Promise((resolve, reject) => { rejectFirst = reject; });
      graph.gui.loadNodePopup(node);
      graph.echartsClickHandler({componentSubType: "lines", seriesType: "lines", data: {link}, seriesIndex: 0, dataIndex: 0});
      rejectFirst(new Error("old request failed"));
      setTimeout(() => {
        const fragment = graph.utils.parseUrlFragments()[graph.config.bookmarkableActions.id];
        done({actual: fragment && fragment.get("nodeId"), expected: link.source + "~" + link.target});
      }, 0);
    `);
    expect(result.actual).toBe(result.expected);
  });
});

describe("Control colors", () => {
  test("uses inverted colors for the graph and map", async () => {
    const driver = await getDriver();
    try {
      await driver.get(urls.basicUsage);
      await getElementByCss(driver, ".sideBarHandle", 5000);
      const graphColors = await driver.executeScript(`
        const button = document.querySelector('.sideBarHandle');
        return [getComputedStyle(button).backgroundColor,
                getComputedStyle(button, '::before').color];
      `);
      expect(graphColors).toEqual(["rgb(255, 255, 255)", "rgb(40, 34, 34)"]);
      await driver.get(urls.geographicMap);
      await getElementByCss(driver, ".leaflet-control-zoom-in", 5000);
      const mapColors = await driver.executeScript(`
        const button = document.querySelector('.sideBarHandle');
        const zoom = document.querySelector('.leaflet-control-zoom-in');
        return [getComputedStyle(button).backgroundColor,
                getComputedStyle(button, '::before').color,
                getComputedStyle(zoom).backgroundColor, getComputedStyle(zoom).color];
      `);
      expect(mapColors).toEqual([
        "rgb(40, 34, 34)",
        "rgb(255, 255, 255)",
        "rgb(40, 34, 34)",
        "rgb(255, 255, 255)",
      ]);
    } finally {
      await tearDown(driver);
    }
  }, 30000);
});
