# netjsongraph.js
  
[![CI](https://github.com/openwisp/netjsongraph.js/workflows/netjsongraph.js%20CI%20BUILD/badge.svg?branch=master)](<[https://travis-ci.org/openwisp/netjsongraph.js](https://github.com/openwisp/netjsongraph.js/actions/workflows/ci.yml)>)
[![Coverage Status](https://coveralls.io/repos/github/openwisp/netjsongraph.js/badge.svg?branch=gsoc2019)](https://coveralls.io/github/openwisp/netjsongraph.js?branch=gsoc2019)
![Language](https://img.shields.io/badge/language-javascript-orange.svg)

![img](/docs/graph.png)
![img](/docs/graph-open.png)
![img](/docs/map.png)
![img](/docs/indoor-map.png)

Leverage the power of [EchartsJS](https://github.com/apache/incubator-echarts) and [LeafletJS](https://github.com/Leaflet/Leaflet) to visualize network topology using the
[NetJSON](http://netjson.org) `NetworkGraph` format.

Build powerful and interoperable visualizations without losing flexibility!

### Install and run demo examples

```
yarn install
yarn start
```

### Arguments

netjsongraph.js accepts two arguments.

1. **url (required, string|array|object)**: URL(s) to fetch the JSON data from. It supports both [NetJSON](http://netjson.org) and GeoJSON data formats. You can also pass a NetJSON or GeoJSON object directly.

NetJSON format used internally is based on [networkgraph](http://netjson.org/rfc.html#rfc.section.4) but with a slight difference as follows：

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

2. **options (optional, object)**: custom options described below

- `el`

  **Default**: `body`

  The element which the graph or map is rendered. You can pass any valid element name or class name or id.

- `render`

  **Default**: `graph`

  The rendering mode. You can render the map by setting it as `map`.

- `metadata`

  **Default**: `true`

  Whether to show [NetJSON](https://netjson.org) NetworkGraph metadata or not. You can also set it `false` to disable it.

- `svgRender`

  **Default**: `false`

  Whether to render it as SVG or not. You can also set it `true` to enable it. Canvas is used when it is set to `false`.

- `switchMode`

  **Default**: `false`

  Whether to allow switching between graph and map render or not. You can also set it `true` to enable it.

- `showLabelsAtZoomLevel`

  **Default**: `7`

  The zoom level at which the labels are shown. This only works when `render` is set to `map`.
  In graph mode, the overlapping labels are hidden automatically when zooming.

- `maxPointsFetched`

  **Default**: `10000`

  The maximum number of nodes to fetch from the server.

- `loadMoreAtZoomLevel`

  **Default**: `9`

  The zoom level at which more nodes are loaded from the server when the total number of nodes are greater than `maxPointsFetched`. These nodes are loaded based on the geographic extent of the map.

- `clustering`

  **Default**: `false`

  Whether to enable clustering of nodes or not. You can also set it `true` to enable it.

- `clusteringThreshold`

  **Default**: `100`

  The threshold of clustering. When the number of nodes is greater than this value, the clustering will be enabled.

- `disableClusteringAtLevel`

  **Default**: `8`

  The zoom level at which clustering is disabled. When the zoom level is greater than this value, all the clusters will be expanded.

- `clusterRadius`

  **Default**: `80`

  The maximum radius that a cluster will cover. Decreasing will make more, smaller clusters and vice versa.

- `clusteringAttribute`

  The property used to cluster the nodes. The nodes with the same properties will be clustered together.

- `dealDataByWorker`

  The url to the worker file if you want to deal the data by a worker.

- `echartsOption`

  The global configuration for Echarts. You can pass any valid Echarts [options](https://echarts.apache.org/en/option.html#title).

- `graphConfig`

  The configuration for the graph render.
  It consists of the following properties:

  ```JS
    graphConfig:{
        series:{
            nodeStyle:{
                // The style of the nodes
            },
            linkStyle:{
                // The style of the links
            },
            nodeSize: string|number,
        },
        baseOptions:{
            // The global configuration for Echarts specifically for the graph.
        }
    }

  ```

  You can see the list available options which can be used in the `series` property of the `graphConfig` in the [Echarts documentation](https://echarts.apache.org/en/option.html#series-graph).

  The `nodeStyle` and `linkStyle` properties are used to customize the style of the nodes and links. The list of all available style properties can be found in the [Echarts documentation](https://echarts.apache.org/en/option.html#series-graph.itemStyle).

  The `nodeSize` property is used to customize the size of the nodes.

  The `baseOptions` property is used to customize the global configuration for Echarts specifically for the graph. This is useful when you have set `switchMode` to `true` and you have to set separate configuration for the graph and the map.

- `mapOptions`

  The configuration for the map render.
  It consists of the following properties:

  ```JS
    mapOptions:{
        nodeConfig:{
            nodeStyle:{
                // The style of the nodes
            },
            nodeSize: string|number,
        },
        linkConfig:{
            linkStyle:{
                // The style of the links
            },
        },
        clusterConfig:{
          // The configuration for the clusters
        },
        baseOptions:{
            // The global configuration for Echarts specifically for the map.
        }
    }
  ```

  We use [Leaflet](https://leafletjs.com) to render the map. You can also pass any valid [Leaflet options](https://leafletjs.com/reference.html#map-option) in `mapOptions`.

  It is mandatory to set `center` in `mapOptions` when you are using the map render which is used to set the initial geographic center of the map. You can learn more about it in the [Leaflet documentation](https://leafletjs.com/reference.html#map-center).

  `nodeConfig` deals with the configuration of the nodes. You can pass any valid [Echarts options](https://echarts.apache.org/en/option.html#series-scatter) in `nodeConfig`.

  The `nodeStyle` property is used to customize the style of the nodes. The list of all available style properties can be found in the [Echarts documentation](https://echarts.apache.org/en/option.html#series-scatter.itemStyle).

  The `nodeSize` property is used to customize the size of the nodes.

  The `clusterConfig` property is used to customize the clusters. You can pass any valid [Echarts options](https://echarts.apache.org/en/option.html#series-scatter.data) in `clusterConfig`. If you are using GeoJSON data, you can customize the cluster styles by using the CSS class`marker-cluster`. You can also use property values when clustering based on data properties as class names.

  `linkConfig` deals with the configuration of the links. You can pass any valid [Echarts options](https://echarts.apache.org/en/option.html#series-lines) in `linkConfig`.

  The `linkStyle` property is used to customize the style of the links. The list of all available style properties can be found in the [Echarts documentation](https://echarts.apache.org/en/option.html#series-lines.lineStyle).

- `mapTileConfig`

  The configuration for the map tiles. You can use multiple tiles by passing an array of tile configurations.

  ```JS
    mapTileConfig:[
        ...,
        {
            label: string,
            urlTemplate: string,
            options:{
                minZoom: number,
                maxZoom: number,
                attribution: string,
            }
        },
        ...
    ]

  ```

  `urlTemplate` is the URL template of the tile provider. You can learn more about the options in the [Leaflet documentation](https://leafletjs.com/reference.html#tilelayer-minzoom).

- `nodeCategories`

  The configuration for different categories of nodes if your data contain nodes of various categories. You can pass an array of categories.
  Each category is an object with the following properties:

  ```JS
      nodeCategories:[
          ...,
          {
              name: string,
              nodeStyle: {
                  // The style of the nodes
              },
              nodeSize: string|number,
          },
          ...
      ]
  ```

  `name` is the name of the category. You can also pass any valid [Echarts options](https://echarts.apache.org/en/option.html#series-graph.itemStyle) in `nodeStyle`.

- `linkCategories`

  The configuration for different categories of links if your data contain links of various categories. You can pass an array of categories.
  Each category is an object with the following properties:

  ```JS
      linkCategories:[
          ...,
          {
              name: string,
              linkStyle: {
                  // The style of the links
              },
          },
          ...
      ]
  ```

  `name` is the name of the category. You can also pass any valid [Echarts options](https://echarts.apache.org/en/option.html#series-graph.lineStyle) in
  `linkStyle`.

- `geoOptions`

  The configuration for the GeoJSON render. It consists of the following properties:

  ```JS
      geoOptions:{
         style:{
             // The style GeoJSON features
         },
      }
  ```

  You can customize the style of GeoJSON features using `style` property. The list of all available properties can be found in the [Leaflet documentation](https://leafletjs.com/reference.html#geojson).

- `onInit`

  The callback function executed on initialization of `NetJSONGraph` instance.

- `onRender`

  The callback function executed at the start of initial render.

- `onUpdate`

  The callback function executed at the start of update.

- `afterUpdate`

  The callback function executed after update.

- `onReady`

  The Callback function executed after initial render.

- `prepareData`

  The callback function executed after data has been loaded. Used to convert data to NetJSON Data normally. You can also use this function to categorize the data based on certain properties in your dataset.

- `onClickElement`

  The callback function executed when a node or link is clicked.

### Configuration instructions

netjsongraph.js mainly relies on the Echarts for rendering, so the related configuration is mainly inherited from [Echarts](https://echarts.apache.org/en/option.html).

The library mainly supports two rendering modes -- `graph` and `map`. You can choose either of these and set it in `render` property in options.

In extreme cases, you can also pass your own render function if you don't want Echarts to render. We will pass in the processed netjson data and netjsongraph object.

For graph, you need to configure `graphConfig` property. We only support [graph](https://echarts.apache.org/en/option.html#series-graph) and [graphGL](https://echarts.apache.org/zh/option-gl.html#series-graphGL). The main difference between **graph** and **graphGL** is the [`forceAtlas2`](https://echarts.apache.org/zh/option-gl.html#series-graphGL.forceAtlas2) param series in Echarts. The latter is mainly used for big data rendering. You can use **graphGL** by setting `graphConfig.type` to `graphGL`. We use **graph** series and **force** layout by default. You can modify them freely according to the documentation.

For map, you need to configure `mapOptions`. The [`mapOptions`](https://leafletjs.com/reference-1.5.0.html#map-option) and [`mapTileConfig`](https://leafletjs.com/reference-1.5.0.html#tilelayer) are required for the map render. You can customize the nodes and links with [`nodeConfig`](https://echarts.apache.org/en/option.html#series-scatter) and [`linkConfig`](https://echarts.apache.org/en/option.html#series-lines) optionally. For map nodes, you can also change the `type` to [`effectScatter`](https://echarts.apache.org/en/option.html#series-effectScatter) series to enable animation effects.

You can also customize some global properties with [`echartsOption`](https://echarts.apache.org/en/option.html) in echarts.

### API Introduction

#### Core

- `setConfig`

  Method to set the configuration of the graph. You can use this function to add, update or modify the configuration of the graph.

- `setUtils`

  Method to set the utils of the graph. You can use this function to add, update the utils.

- `render`

  Method to render the graph.

#### Realtime Update

We use [socket.io](https://socket.io/) to monitor data changes which supports WebSockets and Polling. You can call `JSONDataUpdate` when the data change event occurs and pass the data to update the view.

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

const socket = io("http://localhost:3000/",{ transports : ['websocket'] });

socket.on("connect", function() {
    console.log("client connected");
});
socket.on("disconnect", function() {
    console.log("client disconnected");
});
// Self-monitoring server， re-render when the data changes.
socket.on("netjsonChange", graph.utils.JSONDataUpdate.bind(graph));
```

You can see this in action by executing the following commands:

```
cd examples/realtime_update

yarn install

yarn dev
```

In this demo the nodes and links change after 5 seconds.

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

Demo is [here](https://openwisp.github.io/netjsongraph.js/examples/netjson-searchElements.html).
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

Demo is [here](https://openwisp.github.io/netjsongraph.js/examples/netjson-multipleInterfaces.html).
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

Demo is [here](https://openwisp.github.io/netjsongraph.js/examples/netjson-dateParse.html).

#### Load more data using geographic extent

You can load more data from the server even when the total number of nodes are greater than `maxPointsFetched` using geographic extent.
You can specify the zoom level at which more data is loaded by setting `loadMoreDataZoomLevel` in the config.

You can see this in action by executing the following commands:

```
cd examples/load_data_geo_extent

yarn install

yarn start
```

#### Render

- `generateGraphOption`

  Method to generate graph option in echarts by JSONData.

- `generateMapOption`

  Method to generate map option in echarts by JSONData.

- `graphRender`

  Render the final graph view based on JSONData.

- `mapRender`

  Render the final map view based on JSONData.

#### Utils

- `JSONParamParse`

  Parse JSONParam (string|object), return Promise object.

- `paginatedDataParse`

  Parse paginated response from the server. It accepts `JSONParam` as a parameter.  
  It uses cursor-based pagination by default.  
  If you want to parse from the server that uses some other pagination logic,  
  you can override this method using `setUtils` method.

  ```JS
  graph.setUtils({
      paginatedDataParse: async function(JSONParam){
          // Implement your custom logic here
      }
  });
  ```

  You can see the default implementation [here](https://github.com/openwisp/netjsongraph.js/blob/fb4f79f716996605efe4423cba7604797b7e71ba/src/js/netjsongraph.util.js#L29).

- `getBBoxData`

  Load data which is inside the current bounding box of the map from the server. Accepts `JSONParam` and `bounds` as the parameter.  
   If you want to implement your own logic or use a different API, you can override this method using `setUtils` method.

  ```JS
  graph.setUtils({
      getBBoxData: async function(JSONParam,bounds){
          // Implement your custom logic here
      }
  });
  ```

- `makeCluster`

  Accepts NetJSONGraph instance as parameter and returns an object containing the cluster nodes, other individual nodes and links.

- `isObject`

  Check if the param is object.

- `isArray`

  Check if the param is array.

- `isElement`

  Check if the param is dom element.

- `deepMergeObj`

  Merge multiple objects deeply.

- `updateMetadata`

  Update metadata of JSONData.

- `getMetadata`

  Get the metadata object from JSONData.

- `nodeInfo`

  Get the node info object.

- `linkInfo`

  Get link info object.

- `createTooltipItem`

  Create tooltip item with a key and value in the tooltip modal.

- `getNodeTooltipInfo`

  Get node tooltip info html string.

- `getLinkTooltipInfo`

  Get link tooltip info html string.

- `generateStyle`

  Generate the style configuration of the node or link.

- `getNodeStyle`

  Get node style configuration.

- `getLinkStyle`

  Get link style configuration.

- `showLoading`

  Show loading animation. Used in onRender by default.

- `hideLoading`

  Hide loading animation. Used in onLoad defaultly.

- `createEvent`

  Create an event listener.

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

### Example Demos

The demo shows default `graph` render.  
[Basic graph demo](https://openwisp.github.io/netjsongraph.js/examples/netjsongraph.html)

The demo shows `map` render.  
[Map demo](https://openwisp.github.io/netjsongraph.js/examples/netjsonmap.html)

The demo shows how to use `graphGL` to render big data.  
[graphGL(bigData) demo](https://openwisp.github.io/netjsongraph.js/examples/netjsongraph-graphGL.html)

The demo shows how to set custom attributes.  
[Custom attributes demo](https://openwisp.github.io/netjsongraph.js/examples/netjsongraph-elementsLegend.html)

The demo shows the multiple links render.  
Currently only supports up to two links.  
[Multiple links demo](https://openwisp.github.io/netjsongraph.js/examples/netjsongraph-multipleLinks.html)

The demo is used to show how to deal with the `multiple interfaces` in the NetJSON data.
We provide a work file to process the data before rendering.  
This file provides functions to remove dirty data, deduplicate, handle multiple interfaces, add node links, add flatNodes and so on.  
You can also define related files yourself.  
[Multiple interfaces demo](https://openwisp.github.io/netjsongraph.js/examples/netjson-multipleInterfaces.html)

The demo is used to show the use of the `dateParse` function.  
You can set the node or link property value `time`, we will call this function to parse the string in the element details defaultly.  
Of course you can also call directly.  
[dateParse demo](https://openwisp.github.io/netjsongraph.js/examples/netjson-dateParse.html)

The demo shows how to switch the netjsongraph render mode -- `svg` or `canvas`.  
[Switch render mode demo](https://openwisp.github.io/netjsongraph.js/examples/netjson-switchRenderMode.html)

The demo shows how to switch the netjsongraph render mode -- `graph` or `map`.  
[Switch graph mode demo](https://openwisp.github.io/netjsongraph.js/examples/netjson-switchGraphMode.html)

The demo is used to show the use of the `searchElements` function.  
For test, you can input `test` or `appendData` and click the `search` button.  
[Search elements demo](https://openwisp.github.io/netjsongraph.js/examples/netjson-searchElements.html)

The demo shows how to interact with elements.  
[Nodes expand or fold demo](https://openwisp.github.io/netjsongraph.js/examples/netjsongraph-nodeExpand.html)

The demo is used to show how to use the `JSONDataUpdate` function to update data.  
See other examples：  
netjson-updateData.html: It chooses override data.  
netjsonmap-appendData.html: It chooses append data.  
[JSONDataUpdate using override option demo](https://openwisp.github.io/netjsongraph.js/examples/netjsonmap-nodeTiles.html)

The demo shows hwo to set path animation.  
[Geographic map animated links demo](https://openwisp.github.io/netjsongraph.js/examples/netjsonmap-animation.html)

The demo is used to show how to set indoor map.  
Mainly the operation of leaflet.  
[Indoor map demo](https://openwisp.github.io/netjsongraph.js/examples/netjsonmap-indoormap.html)

The demo is used to show how to use the leaflet plugins.  
Mainly the operation of leaflet.  
[ Leaflet plugins demo](https://openwisp.github.io/netjsongraph.js/examples/netjsonmap-plugins.html)

The demo shows the multiple tiles render.  
[ Map with multiple tiles demo](https://openwisp.github.io/netjsongraph.js/examples/netjsonmap-multipleTiles.html)

The demo is used to show how to use the `JSONDataUpdate` function to update data.  
Here we choose to append data by modify the default parameter.  
See other examples：  
netjson-updateData.html: It chooses override data.  
netjsonmap-nodeTiles.html: override data by different zoom value.  
[JSONDataUpdate using append option demo](https://openwisp.github.io/netjsongraph.js/examples/netjsonmap-appendData.html)

Using array files to append data step by step at start.  
Similiar to the first method, but easier.  
[ Append data using arrays demo](https://openwisp.github.io/netjsongraph.js/examples/netjsonmap-appendData2.html)

The demo shows the clustering of nodes.  
[ Clustering demo](https://openwisp.github.io/netjsongraph.js/examples/netjson-clustering.html)

### Upgrading from 0.1.x versions to 0.2.x

We advise all users of netjsongraph.js who are using the 0.1.x version to
upgrade to the latest version.

The following steps explain how to upgrade.

1. Download the latest version of netjsongraph.js
2. Replace the old version of netjsongraph.min.js with the new version
3. Replace the old version of netjsongraph-theme.css with the new version
4. Replace the old version of netjsongraph.css with the new version
5. Replace the deprecated options with the equivalent new options. See the **Arguments** section for more details.

The following list shows the deprecated options:

- `defaultStyle`
- `scaleExtent`
- `charge`
- `linkDistance`
- `linkStrength`
- `friction`
- `gravity`
- `theta`
- `chargeDistance`
- `nodeClassProperty`
- `linkClassProperty`
- `circleRadius`
- `labelDx`
- `labelDy`
- `onEnd`
- `linkDistanceFunc`
- `redraw`
- `onClickNode`
- `onClickLink`

The function definition for `onInit` and `onLoad` has been changed:
passing any additional arguments to these functions is not needed anymore.

The option `linkDistance` has been renamed to `edgeLength`.
Options like `edgeLength`, `friction`, `gravity` are now passed as an object
named `force` in `series` property of `graphConfig`.
Learn more about `graphConfig` by looking at the [Arguments section](#arguments).
Refer to the [Echarts documentation](https://echarts.apache.org/en/option.html#series-graph.force) for more details.

Use `label` instead of `labelDx` and `labelDy` in the `series` property of `graphConfig`.
Refer to the [Arguments section](#arguments) for more details.
You can learn more about `label` in the
[Echarts documentation](https://echarts.apache.org/en/option.html#series-graph.label).

Use `onClickElement` instead of `onClickNode` and `onClickLink`.
Refer to the [Arguments section](#arguments) section for more details.

### Contributing

1. Fork it!
2. Create your feature branch: git checkout -b my-new-feature
3. Commit your changes: git commit -am 'Add some feature'
4. Push to the branch: git push origin my-new-feature
5. Submit a pull request :D

### License

[BSD 3-Clause License](https://github.com/interop-dev/netjsongraph.js/blob/master/LICENSE).
