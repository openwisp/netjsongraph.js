# netjsongraph.js

[![Travis (.org) branch](https://img.shields.io/travis/openwisp/netjsongraph.js/gsoc2019.svg)](https://travis-ci.org/openwisp/netjsongraph.js)
[![Coverage Status](https://coveralls.io/repos/github/openwisp/netjsongraph.js/badge.svg?branch=gsoc2019)](https://coveralls.io/github/openwisp/netjsongraph.js?branch=gsoc2019)
![Download](https://img.shields.io/npm/dt/netjsongraph.js.svg)
![NPM](https://img.shields.io/npm/v/netjsongraph.js.svg)
![Language](https://img.shields.io/badge/language-javascript-orange.svg)
       
[![NPM](https://nodei.co/npm/netjsongraph.js.png)](https://nodei.co/npm/netjsongraph.js/)
         
![img](/examples/data/netjsongraph.png)
![img](/examples/data/netjsonmap.png)
![img](/examples/data/netjsonindoormap.png)

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

- url (required, string): URL to fetch the JSON data from
- options (optional, object): custom options described below
    - el: Container element. "body" defaultly.
    - metadata: Whether to show NetJSON NetworkGraph metadata or not, defaults to true
    - svgRender: Use SVG render?

    - echartsOption: A global configuration of Echarts.

    - graphConfig: Configuration of graph series(graphRender).

    - mapCenter: Map init center.
    - mapZoom: Map init zoom.
    - mapRoam: Is Map can zoom or move?
    - mapTileConfig: Map tiles config array, whose format is [url, option].
    - mapLineConfig: Support multiple lines superimposed style.
    - mapNodeConfig: Map node style.      
    
    - nodeSize: The size of nodes in pixel.
    - nodeStyleProperty: Used to custom node style.
    - linkStyleProperty: Used to custom link style.

    - onInit: Callback function executed on initialization.
    - onLoad: Callback function executed when rendered.
    - prepareData: Callback function executed after data has been loaded. Used to convert data to NetJSON Data normally.
    - onClickElement: Called when a node or link is clicked.

### Example Usage

```
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
            render: graphRender,
        });
        graph.render();
    </script>
</body>
</html>
```

### Different Demos

[NetJSON graph base Demo](https://kutugu.github.io/NetJSONDemo/examples/netjsongraph.html)

[NetJSON graph elements legend Demo](https://kutugu.github.io/NetJSONDemo/examples/netjsongraph-elementsLegend.html)
     
[NetJSON map base Demo](https://kutugu.github.io/NetJSONDemo/examples/netjsonmap.html)
         
[NetJSON bigData Demo](https://kutugu.github.io/NetJSONDemo/examples/netjson-bigData.html)
         
[NetJSON multiple interfaces Demo](https://kutugu.github.io/NetJSONDemo/examples/netjson-multipleInterfaces.html)       

[NetJSON dataParse Demo](https://kutugu.github.io/NetJSONDemo/examples/netjson-dateParse.html)

[NetJSON updateData realtime Demo](https://kutugu.github.io/NetJSONDemo/examples/netjson-updateData.html)

[NetJSON switch render mode Demo](https://kutugu.github.io/NetJSONDemo/examples/netjson-switchRenderMode.html)

[NetJSON switch graph mode Demo](https://kutugu.github.io/NetJSONDemo/examples/netjson-switchGraphMode.html)

[NetJSON search elements Demo](https://kutugu.github.io/NetJSONDemo/examples/netjson-searchElements.html)

[NetJSON map animation lines Demo](https://kutugu.github.io/NetJSONDemo/examples/netjsonmap-animation.html)

[NetJSON indoormap Demo](https://kutugu.github.io/NetJSONDemo/examples/netjsonmap-indoormap.html)

[NetJSON map plugins Demo](https://kutugu.github.io/NetJSONDemo/examples/netjsonmap-plugins.html)

### How to migrate the previous version

#### Parameters deleted

Because of the different libraries used, some of the parameters of the previous version may disappear, especially some of the parameters of the Force map algorithm.But you don't have to delete them, it doesn't have a negative impact.

These parameters have been removed for this demo：

- animationAtStart: true
- charge: -130,                                
- linkStrength: 0.2,
- friction: 0.9,  // d3 default
- chargeDistance: Infinity,  // d3 default
- theta: 0.8,  // d3 default

#### New features added

##### Realtime Update

If you want to update the data in real time, you have to realize realtime updated algorithm because of its customizable.
Then you only need call `JSONDataUpdate` to update the view.

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

##### Search elements

If you want to add search elements function, you just need to pass the url as param to `searchElements`, which will return a function `searchFunc`.
Then you just need to obtain the value input, and pass it to the `searchFunc`.

The view will change if the value is valid, and you can also click the back button of browser to go back.

##### DateParse
          
### Contributing

1. Fork it!
2. Create your feature branch: git checkout -b my-new-feature
3. Commit your changes: git commit -am 'Add some feature'
4. Push to the branch: git push origin my-new-feature
5. Submit a pull request :D

### License

[BSD 3-Clause License](https://github.com/interop-dev/netjsongraph.js/blob/master/LICENSE).
