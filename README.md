# netjsongraph.js

[![Travis (.org) branch](https://img.shields.io/travis/openwisp/netjsongraph.js/gsoc2019.svg)](https://travis-ci.org/openwisp/netjsongraph.js)
[![Coverage Status](https://coveralls.io/repos/github/openwisp/netjsongraph.js/badge.svg?branch=gsoc2019)](https://coveralls.io/github/openwisp/netjsongraph.js?branch=gsoc2019)
![Download](https://img.shields.io/npm/dt/netjsongraph.js.svg)
![NPM](https://img.shields.io/npm/v/netjsongraph.js.svg)
![Language](https://img.shields.io/badge/language-javascript-orange.svg)

![img](/docs/netjsongraph.png)
![img](/docs/netjsonmap.png)
![img](/docs/netjsonmap-indoormap.png)

Leverage the power of [EchartsJS](https://github.com/apache/incubator-echarts) and [LeafletJS](https://github.com/Leaflet/Leaflet) to visualize network topology using the
[NetJSON](http://netjson.org) `NetworkGraph` format.

Build powerful and interoperable visualizations without losing flexibility!

**This library is still in early stages, feedback and contributions are very welcome**.

### Install

```
npm install
npm run start

npm run build
```

### Arguments

netjsongraph.js accepts two arguments.

- url (required, string|array): URL(s) to fetch the JSON data from.
  JSON format used internally based on [networkgraph](http://netjson.org/rfc.html#rfc.section.4), but a little different: more occupied property names internally as follows：

```JS
{
    nodes: [{
        properties ? : {
            // Define node category
            category ? : String,

            /*
                Define the geographic coordinates of the node.
                Required when rendering a map.
            */
            location ? : {
                lng: Float,
                lat: Float,
            },

            // Define node updated time
            time ? : String
        }
    }],
    links: [{
        properties ? : {
            // Define link updated time
            time ? : String
        }
    }]
    flatNodes ? : {
        <node id>: node Object
    }
}
```

- options (optional, object): custom options described below

  - el: Container element. "body" defaultly.
  - render: Render function. "graph" defaultly.
  - metadata: Whether to show NetJSON NetworkGraph metadata or not, defaults to true
  - svgRender: Use SVG render? Canvas defaultly.
  - dealDataByWorker: WebWorker file url.

  - echartsOption: A global configuration of Echarts.

  - graphConfig: Configuration of graph series(graphRender).

  - mapOption: Map init option.
  - mapTileConfig: Map tiles config array, whose format is [{label, urlTemplate, options}].
  - mapLinkConfig: Support multiple lines superimposed style.
  - mapNodeConfig: Map node style.

  - nodeSize: The size of nodes in pixel.
  - nodeStyleProperty: Used to custom node style.
  - linkStyleProperty: Used to custom link style.

  - onInit: Callback function executed on initialization.
  - onRender: Callback function executed when **first** render start.
  - onUpdate: Callback function executed on update start.
  - afterUpdate: Callback function executed after update.
  - onLoad: Callback function executed when **first** rendered.
  - prepareData: Callback function executed after data has been loaded. Used to convert data to NetJSON Data normally.
  - onClickElement: Callback function executed when a node or link is clicked.

### Configuration instructions

`NetJSONGraph.js` mainly relies on the `Echarts` for rendering, so the related configuration is mainly inherited from [echarts](https://echarts.apache.org/en/option.html).

`NetJSONGraph.js` mainly support two rendering modes -- `graph` or `map`, you must set it as the `render` property of `options`.
In extreme cases, you can also pass your own render function if you don't need `echarts` to render.We will pass in the processed `netjson` data and `netjsongraph` object.

For `graph`, you need to configure `graphConfig` property mainly.
We only support [`graph`](https://echarts.apache.org/en/option.html#series-graph) or [`graphGL`](https://echarts.apache.org/zh/option-gl.html#series-graphGL)(Sorry for no english document yet, the biggest difference from graph is the [`forceAtlas2`](https://echarts.apache.org/zh/option-gl.html#series-graphGL.forceAtlas2) param) series in `echarts`.
The latter is mainly used for big data rendering. You can select them by `graphConfig.type` property.
We use `graph` series and `force` layout by default. You can modify them freely according to the documentation.

For `map`, you need to configure map related options.
The [`mapOptions`](https://leafletjs.com/reference-1.5.0.html#map-option) and [`mapTileConfig`](https://leafletjs.com/reference-1.5.0.html#tilelayer)(note：It's an array) are needed when map render.
You can customize the nodes and links with [`mapLinkConfig`](https://echarts.apache.org/en/option.html#series-lines)(note：It's an array) and [`mapNodeConfig`](https://echarts.apache.org/en/option.html#series-scatter) optionally.For `map node`, you can also change the `type` to [`effectScatter`](https://echarts.apache.org/en/option.html#series-effectScatter) series.
The difference between them and `nodeStyleProperty`、`linkStyleProperty` is that the latter two are just the style properties of the former.

You can also customize some global properties with [`echartsOption`](https://echarts.apache.org/en/option.html) in echarts.

### API Introduction

#### Core

- setConfig: modify config
- setUtils: add new utils
- render: netjsongraph.js render function

#### Realtime Update

If you want to update the data dynamically, you have to write function to get updated data.
Then you only need call `JSONDataUpdate` and pass the data to update the view.

```JS
/**
 * @function
 * @name JSONDataUpdate
 * Callback function executed when data update. Update Information and view.
 *
 * @param  {object|string}  Data     JSON data or url.
 * @param  {boolean}        override If old data need to be overrided? True defaultly. (Attention: Only 'map' render can set it `false`!)
 * @param  {boolean}        isRaw    If the data need to deal with the configuration? True defaultly.
 *
 * @this   {object}         NetJSONGraph object
 *
 */

const graph = new NetJSONGraph("./data/netjsonmap.json", {
    render: "graph",
});

graph.render();

const socket = io("http://localhost:8078");
socket.on("connect", function() {
    console.log("client connect");
});
socket.on("disconnect", function() {
    console.log("client disconnected.");
});
// Self-monitoring server， re-render when the data changes.
socket.on("netjsonChange", graph.utils.JSONDataUpdate.bind(graph));
```

Demo is [here](https://kutugu.github.io/NetJSONDemo/examples/netjson-updateData.html).
I use [socket.io](https://socket.io/) to monitor data changes, which supports WebSocket or polling.
And I build a simple local server using the express framework and nodeJS. Before testing, you need to open it.

The code to build a local server can be found [here](https://github.com/openwisp/netjsongraph.js/tree/gsoc2019/examples/data/netjsonnode/).

Execute in this directory:

```
npm install

node index.js
```

Then open the demo page, you will find that the nodes and links in the view change after 5 seconds.

#### Search elements

If you want to add search elements function, you just need to pass the url as param to `searchElements`, which will return a function `searchFunc`.
Then you just need to obtain the value input, and pass it to the `searchFunc`.
`searchFunc` is similar to JSONDataUpdate, you can also set `appendData` and `isRaw` params according to different conditions.

```JS
/**
 * @function
 * @name searchElements
 * Add search function for new data.
 *
 * @param  {string}         url      listen url
 *
 * @this   {object}         NetJSONGraph object
 *
 * @return {function}       searchFunc
 */

const graph = new NetJSONGraph("./data/netjsonmap.json", {
    onLoad: function(){
        let searchContainer = document.createElement("div"),
            searchInput = document.createElement("input"),
            searchBtn = document.createElement("button"),
            /*
                Pass in the url to listen to, and save the returned function.
                Please ensure that the return value of the api is the specified json format.
            */
            searchFunc = this.utils.searchElements.call(this, "https://ee3bdf59-d14c-4280-b514-52bd3dfc2c17.mock.pstmn.io/?search=");

        searchInput.setAttribute("class", "njg-searchInput");
        searchInput.placeholder = "Input value for searching special elements.";
        searchBtn.setAttribute("class", "njg-searchBtn");
        searchBtn.innerHTML = "search";
        searchContainer.setAttribute("class", "njg-searchContainer");
        searchContainer.appendChild(searchInput);
        searchContainer.appendChild(searchBtn);
        this.el.appendChild(searchContainer);

        searchInput.onchange = () => {
            // do something to deal user input value.
        };

        searchBtn.onclick = () => {
            let inputValue = searchInput.value.trim();

            /*
                Pass in the relevant search value,
                which will re-render automatically according to the request result within the function.
            */
            if(inputValue === "appendData"){
                // appendData
                searchFunc(inputValue, false);
            }
            else{
                searchFunc(inputValue);
            }

            searchInput.value = "";
        }

        this.utils.hideLoading();
    }
});

graph.render();
```

Demo is [here](https://kutugu.github.io/NetJSONDemo/examples/netjson-searchElements.html).
You can input `test`(overrideData) or `appendData`(appendData) and click the `search` button.
The view will change if the value is `valid`, and you can also click the back button of browser to `go back`.

#### Deal data by WebWorker

You can deal with the data asynchronously by `dealDataByWorker`.

```JS
/**
 * @function
 * @name dealDataByWorker
 * Deal JSONData by WebWorker.
 *
 * @param  {object}    JSONData     NetJSONData
 * @param  {string}    workerFile   url
 * @param  {function}  callback     override data and render defaultly.
 *
 * @this   {object}    _this        NetJSONGraph object
 *
 */
```

Demo is [here](https://kutugu.github.io/NetJSONDemo/examples/netjson-multipleInterfaces.html).
You can simply set the `dealDataByWorker` param in config to process the data asynchronously before rendering.
Of course you can also call the function directly.

#### DateParse

We provide a function -- `dataParse` for parsing the `time` field.
We mainly use it to parse the time into the browser's current time zone based on the incoming matching rules.

```JS
/**
 * @function
 * @name dateParse
 *
 * Parse the time in the browser's current time zone based on the incoming matching rules.
 * The exec result must be [date, year, month, day, hour, minute, second, millisecond?]
 *
 * @param  {string}          dateString    "2000-12-31T23:59:59.999Z"
 * @param  {object(RegExp)}  parseRegular  /^([1-9]\d{3})-(\d{1,2})-(\d{1,2})T(\d{1,2}):(\d{1,2}):(\d{1,2})(?:\.(\d{1,3}))?Z$/ defaultly
 * @param  {number}          hourDiffer    you can custom time difference, default is the standard time difference

*
* @return {string}    Date string
*/
```

If you provide `time` field in node or link's properties, it'll display the parse date in the detail info defaultly.

Demo is [here](https://kutugu.github.io/NetJSONDemo/examples/netjson-dateParse.html).

#### Render

- generateGraphOption: generate graph option in echarts by JSONData.
- generateMapOption: generate map option in echarts by JSONData.
- graphRender: Render the final graph view based on JSONData.
- mapRender: Render the final map view based on JSONData.

#### Utils

- JSONParamParse: parse JSONParam(string|object), return Promise object.
- isObject
- isArray
- isElement: judge parameter is a dom element.
- deepMergeObj: merge multiple objects deeply.
- NetJSONMetadata: generate metadata info container, return DOM.
- updateMetadata
- nodeInfo: generate node info html string.
- linkInfo: generate link info html string.
- showLoading: display loading animation. Used in onRender defaultly.
- hideLoading: hide loading animation. Used in onLoad defaultly.
- createEvent: create event listener.

### Example Usage

```HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <title>netjsongraph.js: basic example</title>
    <meta charset="utf-8">
    <!-- theme can be easily customized via css -->
    <link href="../src/css/netjsongraph-theme.css" rel="stylesheet">
    <link href="../src/css/netjsongraph.css" rel="stylesheet">
</head>
<body>
    <script type="text/javascript" src="../dist/netjsongraph.min.js"></script>
    <script type="text/javascript">
        const graph = new NetJSONGraph("../src/data/netjson.json", {
            render: "graph",
        });
        graph.render();
    </script>
</body>
</html>
```

### Different Demos

The demo shows default `graph` render.  
[NetJSON graph base Demo](https://kutugu.github.io/NetJSONDemo/examples/netjsongraph.html)

The demo shows `map` render.  
[NetJSON map base Demo](https://kutugu.github.io/NetJSONDemo/examples/netjsonmap.html)

The demo shows how to use `graphGL` to render big data.  
[NetJSON graphGL(bigData) Demo](https://kutugu.github.io/NetJSONDemo/examples/netjsongraph-graphGL.html)

The demo shows how to set colorful elements.  
[NetJSON graph elements legend Demo](https://kutugu.github.io/NetJSONDemo/examples/netjsongraph-elementsLegend.html)

The demo shows the multiple links render.  
Currently only supports up to two links.  
[NetJSON graph multiple links Demo](https://kutugu.github.io/NetJSONDemo/examples/netjsongraph-multipleLinks.html)

The demo is used to show how to deal with the `multiple interfaces` in the NetJSON data.
We provide a work file to process the data before rendering.  
This file provides functions to remove dirty data, deduplicate, handle multiple interfaces, add node links, add flatNodes and so on.  
You can also define related files yourself.  
[NetJSON multiple interfaces Demo](https://kutugu.github.io/NetJSONDemo/examples/netjson-multipleInterfaces.html)

The demo is used to show the use of the `dataParse` function.  
You can set the node or link property value `time`, we will call this function to parse the string in the element details defaultly.  
Of course you can also call directly.  
[NetJSON dataParse Demo](https://kutugu.github.io/NetJSONDemo/examples/netjson-dateParse.html)

The demo is used to show how to use the `JSONDataUpdate` function to update data.  
In this example we use socket.io to listen for server messages.  
Adopted the default parameters of function --  
overrride old data and deal with the new data with the processing function set in config.
See other examples：  
netjsonmap-appendData.html: It chooses append data.  
netjsonmap-nodeTiles.html: override data by different zoom value.  
[NetJSON updateData realtime Demo](https://kutugu.github.io/NetJSONDemo/examples/netjson-updateData.html)

The demo shows how to switch the netjsongraph render mode -- `svg` or `canvas`.  
[NetJSON switch render mode Demo](https://kutugu.github.io/NetJSONDemo/examples/netjson-switchRenderMode.html)

The demo shows how to switch the netjsongraph render mode -- `graph` or `map`.  
[NetJSON switch graph mode Demo](https://kutugu.github.io/NetJSONDemo/examples/netjson-switchGraphMode.html)

The demo is used to show the use of the `searchElements` function.  
For test, you can input `test` or `appendData` and click the `search` button.  
[NetJSON search elements Demo](https://kutugu.github.io/NetJSONDemo/examples/netjson-searchElements.html)

The demo shows hwo to interact with elements.  
[NetJSON nodes expand or fold Demo](https://kutugu.github.io/NetJSONDemo/examples/netjsongraph-nodeExpand.html)

The demo is used to show how to use the `JSONDataUpdate` function to update data.  
See other examples：  
netjson-updateData.html: It chooses override data.  
netjsonmap-appendData.html: It chooses append data.  
[NetJSON map nodes zoom tiles Demo](https://kutugu.github.io/NetJSONDemo/examples/netjsonmap-nodeTiles.html)

The demo shows hwo to set path animation.  
[NetJSON map animation lines Demo](https://kutugu.github.io/NetJSONDemo/examples/netjsonmap-animation.html)

The demo is used to show how to set indoor map.  
Mainly the operation of leaflet.  
[NetJSON indoormap Demo](https://kutugu.github.io/NetJSONDemo/examples/netjsonmap-indoormap.html)

The demo is used to show how to set indoor map.  
Similiar to the first method, the difference is the setting of image's position.  
[NetJSON indoormap 2 Demo](https://kutugu.github.io/NetJSONDemo/examples/netjsonmap-indoormap2.html)

The demo is used to show how to use the leaflet plugins.  
Mainly the operation of leaflet.  
[NetJSON map plugins Demo](https://kutugu.github.io/NetJSONDemo/examples/netjsonmap-plugins.html)

The demo shows the multiple tiles render.  
[NetJSON map multiple tiles Demo](https://kutugu.github.io/NetJSONDemo/examples/netjsonmap-multipleTiles.html)

The demo is used to show how to use the `JSONDataUpdate` function to update data.  
Here we choose to append data by modify the default parameter.  
See other examples：  
netjson-updateData.html: It chooses override data.  
netjsonmap-nodeTiles.html: override data by different zoom value.  
[NetJSON map append data Demo](https://kutugu.github.io/NetJSONDemo/examples/netjsonmap-appendData.html)

Using array files to append data step by step at start.  
Similiar to the first method, but easier.  
[NetJSON map append data 2 Demo](https://kutugu.github.io/NetJSONDemo/examples/netjsonmap-appendData2.html)

### Contributing

1. Fork it!
2. Create your feature branch: git checkout -b my-new-feature
3. Commit your changes: git commit -am 'Add some feature'
4. Push to the branch: git push origin my-new-feature
5. Submit a pull request :D

### License

[BSD 3-Clause License](https://github.com/interop-dev/netjsongraph.js/blob/master/LICENSE).
