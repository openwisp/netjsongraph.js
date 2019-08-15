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
[NetJSON](http://netjson.org) ``NetworkGraph`` format.

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

- url (required, string): URL to fetch the JSON data from. 
               
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
    - metadata: Whether to show NetJSON NetworkGraph metadata or not, defaults to true
    - svgRender: Use SVG render? Canvas defaultly.

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
    - onLoad: Callback function executed when rendered.
    - prepareData: Callback function executed after data has been loaded. Used to convert data to NetJSON Data normally.
    - onClickElement: Called when a node or link is clicked.

### Configuration instructions

`NetJSONGraph.js` mainly relies on the `Echarts` for rendering, so the related configuration is mainly inherited from [echarts](https://echarts.apache.org/en/option.html).

`NetJSONGraph.js` mainly support two rendering modes -- `graph` or `map`, you must set it as the `render` property of `options`.
In extreme cases, you can also pass your own render function if you don't need `echarts` to render.We will pass in the processed `netjson` data and `netjsongraph` object.

For `graph`, you need to configure `graphConfig` property mainly.
We only support [`graph`](https://echarts.apache.org/en/option.html#series-graph) or [`graphGL`](https://echarts.apache.org/zh/option-gl.html#series-graphGL)(Sorry for no english document yet, the biggest difference from graph is the [`forceAtlas2`](https://echarts.apache.org/zh/option-gl.html#series-graphGL.forceAtlas2) param) series in `echarts`.
The latter is mainly used for big data rendering.You can select them by `graphConfig.type` property.
We use `graph` series and `force` layout by default.You can modify them freely according to the documentation.

For `map`, you need to configure map related options.
The [`mapOptions`](https://leafletjs.com/reference-1.5.0.html#map-option) and [`mapTileConfig`](https://leafletjs.com/reference-1.5.0.html#tilelayer)(note：It's an array) are needed when map render.
You can customize the nodes and links with [`mapLinkConfig`](https://echarts.apache.org/en/option.html#series-lines)(note：It's an array) and [`mapNodeConfig`](https://echarts.apache.org/en/option.html#series-scatter) optionally.For `map node`, you can also change the `type` to [`effectScatter`](https://echarts.apache.org/en/option.html#series-effectScatter) series.
The difference between them and `nodeStyleProperty`、`linkStyleProperty` is that the latter two are just the style properties of the former.

You can also customize some global properties with [`echartsOption`](https://echarts.apache.org/en/option.html) in echarts.

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

[NetJSON graph base Demo](https://kutugu.github.io/NetJSONDemo/examples/netjsongraph.html)
     
[NetJSON map base Demo](https://kutugu.github.io/NetJSONDemo/examples/netjsonmap.html)
         
[NetJSON graphGL(bigData) Demo](https://kutugu.github.io/NetJSONDemo/examples/netjsongraph-graphGL.html)

[NetJSON graph elements legend Demo](https://kutugu.github.io/NetJSONDemo/examples/netjsongraph-elementsLegend.html)

[NetJSON graph multiple links Demo] (https://kutugu.github.io/NetJSONDemo/examples/netjsongraph-multipleLinks.html)
         
[NetJSON multiple interfaces Demo](https://kutugu.github.io/NetJSONDemo/examples/netjson-multipleInterfaces.html)       

[NetJSON dataParse Demo](https://kutugu.github.io/NetJSONDemo/examples/netjson-dateParse.html)

[NetJSON updateData realtime Demo](https://kutugu.github.io/NetJSONDemo/examples/netjson-updateData.html)

[NetJSON switch render mode Demo](https://kutugu.github.io/NetJSONDemo/examples/netjson-switchRenderMode.html)

[NetJSON switch graph mode Demo](https://kutugu.github.io/NetJSONDemo/examples/netjson-switchGraphMode.html)

[NetJSON search elements Demo](https://kutugu.github.io/NetJSONDemo/examples/netjson-searchElements.html)

[NetJSON nodes expand or fold Demo](https://kutugu.github.io/NetJSONDemo/examples/netjsongraph-nodeExpand.html)

[NetJSON map nodes zoom tiles Demo](https://kutugu.github.io/NetJSONDemo/examples/netjsonmap-nodeTiles.html)

[NetJSON map animation lines Demo](https://kutugu.github.io/NetJSONDemo/examples/netjsonmap-animation.html)

[NetJSON indoormap Demo](https://kutugu.github.io/NetJSONDemo/examples/netjsonmap-indoormap.html)

[NetJSON map plugins Demo](https://kutugu.github.io/NetJSONDemo/examples/netjsonmap-plugins.html)

[NetJSON map multiple tiles Demo](https://kutugu.github.io/NetJSONDemo/examples/netjsonmap-multipleTiles.html)

### New features added

#### Realtime Update

If you want to update the data in real time, you have to realize realtime updated algorithm because of its customizable.
Then you only need call `JSONDataUpdate` to update the view.

```JS
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

For show, I write a demo [here](https://kutugu.github.io/NetJSONDemo/examples/netjson-updateData.html).
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

```JS
const graph = new NetJSONGraph("./data/netjsonmap.json", {
    render: "graph",
});

graph.render();

(function addSearchDOM(_this) {
    let searchContainer = document.createElement("div"),
        searchInput = document.createElement("input"),
        searchBtn = document.createElement("button"),
        /*
            Pass in the url to listen to, and save the returned function.
            Please ensure that the return value of the api is the specified json format.
        */
        searchFunc = _this.utils.searchElements("https://ee3bdf59-d14c-4280-b514-52bd3dfc2c17.mock.pstmn.io/?search=", _this);
    searchInput.setAttribute("class", "njg-searchInput");
    searchInput.placeholder = "Input value for searching special elements.";
    searchBtn.setAttribute("class", "njg-searchBtn");
    searchBtn.innerHTML = "search";
    searchContainer.setAttribute("class", "njg-searchContainer");
    searchContainer.appendChild(searchInput);
    searchContainer.appendChild(searchBtn);
    _this.el.appendChild(searchContainer);
    searchInput.onchange = () => {
        // do something to deal user input value.
    };
    searchBtn.onclick = () => {
        let inputValue = searchInput.value.trim();
        
        /*
            Pass in the relevant search value, 
            which will re-render automatically according to the request result within the function.
        */
        searchFunc(inputValue);
        searchInput.value = "";
    }
})(graph)
```

The view will change if the value is valid, and you can also click the back button of browser to go back.

#### DateParse
          
### Contributing

1. Fork it!
2. Create your feature branch: git checkout -b my-new-feature
3. Commit your changes: git commit -am 'Add some feature'
4. Push to the branch: git push origin my-new-feature
5. Submit a pull request :D

### License

[BSD 3-Clause License](https://github.com/interop-dev/netjsongraph.js/blob/master/LICENSE).
