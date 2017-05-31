netjsongraph.js
===============

.. image:: https://raw.githubusercontent.com/interop-dev/netjsongraph.js/master/docs/netjsongraph-default.png

Leverage the power of `d3.js <http://d3js.org/>`__ to visualize network topology using the
`NetJSON <http://netjson.org>`__ ``NetworkGraph`` format.

Build powerful and interoperable visualizations without losing flexibility!

**This library is still in early stages, feedback and contributions are very welcome**.

Examples:

* `default style <https://nodeshot.org/netjsongraph/examples/index.html>`__
* `dark green example <https://nodeshot.org/netjsongraph/examples/dark.html>`__
* `light green example <https://nodeshot.org/netjsongraph/examples/green.html>`__
* `custom attributes example <https://nodeshot.org/netjsongraph/examples/custom-attributes.html>`__
* `NetJSON NetworkCollection example <https://nodeshot.org/netjsongraph/examples/network-collection.html>`__
* `callbacks example <https://nodeshot.org/netjsongraph/examples/callbacks.html>`__

Install
-------

.. code-block:: bash

    # install via yarn
    yarn add netjsongraph.js --save

    # or install via npm
    npm install netjsongraph.js --save

Arguments
---------

*netjsongraph.js* accepts two arguments

1. ``url`` (**required**, string): URL to fetch the JSON data from
2. ``options`` (optional, object): custom options described below
    * ``el``: container element, defaults to ``"body"``
    * ``metadata``: whether to show `NetJSON <http://netjson.org>`__ ``NetworkGraph`` metadata or not, defaults to ``true``
    * ``defaultStyle``: whether to use the default style or not, defaults to ``true``
    * ``scaleExtent``: see `d3 Zoom scaleExtent <https://github.com/mbostock/d3/wiki/Zoom-Behavior#scaleExtent>`__, defaults to ``[0.25, 5]``
    * ``charge``: see `d3 Zoom charge <https://github.com/mbostock/d3/wiki/Force-Layout#charge>`__, defaults to ``-130``
    * ``linkDistance``: see `d3 Zoom linkDistance <https://github.com/mbostock/d3/wiki/Force-Layout#linkDistance>`__, defaults to ``50``,
    * ``linkStrength``: see `d3 Zoom linkStrength <https://github.com/mbostock/d3/wiki/Force-Layout#linkStrength>`__, defaults to ``0.2``,
    * ``friction``: see `d3 Zoom friction <https://github.com/mbostock/d3/wiki/Force-Layout#friction>`__, defaults to ``0.9``
    * ``chargeDistance``: see `d3 Zoom chargeDistance <https://github.com/mbostock/d3/wiki/Force-Layout#chargeDistance>`__, defaults to ``Infinity``
    * ``theta``: see `d3 Zoom theta <https://github.com/mbostock/d3/wiki/Force-Layout#theta>`__, defaults to ``0.8``
    * ``gravity``: see `d3 Zoom gravity <https://github.com/mbostock/d3/wiki/Force-Layout#gravity>`__, defaults to ``0.1``
    * ``nodeClassProperty``: if specified, nodes will have an additional CSS class that depends on the value of a specific NetJSON node property
    * ``linkClassProperty``: if specified, links will have an additional CSS class that depends on the value of a specific NetJSON link property
    * ``circleRadius``: radius of circles (nodes) in pixel, defalts to ``8``
    * ``labelDx``: SVG dx (distance on x axis) attribute of node labels in graph ``0``
    * ``labelDy``: SVG dy (distance on y axis) attribute of node labels in graph ``-1.3em``
    * ``onInit``: callback function executed on initialization, params: ``url`` and ``options``
    * ``onLoad``: callback function executed after data has been loaded, params: ``url`` and ``options``
    * ``onEnd``: callback function executed when initial animation is complete, params: ``url`` and ``options``
    * ``linkDistanceFunc``: by default high density areas have longer links, you can tweak this behaviour if you need
    * ``redraw``: function called when panning and zooming, you can tweak it if you need
    * ``prepareData``: function used to convert NetJSON NetworkGraph to the javascript data structured used internally, you won't need to modify it in most cases
    * ``onClickNode``: function called when a node is clicked, you can customize it if you need
    * ``onClickLink``: function called when a link is clicked, you can customize it if you need

Example Usage
-------------

Very basic:

.. code-block:: html

    <!DOCTYPE html>
    <html>
        <head>
            <link href="src/netjsongraph.css" rel="stylesheet">
            <!-- theme can be easily customized via css -->
            <link href="src/netjsongraph-theme.css" rel="stylesheet">
        </head>
        <body>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min.js"></script>
            <script src="src/netjsongraph.js"></script>
            <script>d3.netJsonGraph("netjson.json");</script>
        </body>
    </html>

Show graph in a container:

.. code-block:: html

    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <link href="src/netjsongraph.css" rel="stylesheet">
        <!-- theme can be easily customized via css -->
        <link href="src/netjsongraph-theme.css" rel="stylesheet">
        <style type="text/css">
            body {
                font-family: Arial, sans-serif;
                font-size: 13px;
            }

            #network-graph{
                width: 1000px;
                height: 800px;
                margin: 0 auto;
                border: 1px solid #ccc;
            }
        </style>
    </head>
    <body>
        <div id="network-graph"></div>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min.js"></script>
        <script src="src/netjsongraph.js"></script>
        <script>
            d3.netJsonGraph("netjson.json", {
                el: "#network-graph"
            });
        </script>
    </body>
    </html>

Styling
-------

The library comes with a default theme and a default style (color) for nodes,
you can disable this by passing the option
``defaultStyle: false`` and define your own CSS rules.

Here's a fulle example of how to show green links and dark green nodes:

.. code-block:: html

    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <link href="src/netjsongraph.css" rel="stylesheet">
        <!-- custom theme example -->
        <style type="text/css">
            body {
                font-family: Arial, sans-serif;
                font-size: 13px;
            }

            .njg-overlay{
                width: auto;
                height: auto;
                min-width: 200px;
                max-width: 400px;
                border: 1px solid #000;
                border-radius: 2px;
                background: rgba(0, 0, 0, 0.7);
                top: 10px;
                right: 10px;
                padding: 0 15px;
                font-family: Arial, sans-serif;
                font-size: 14px;
                color: #fff
            }

            .njg-node {
                fill: #008000;
                fill-opacity: 0.8;
                stroke: #008000;
                stroke-width: 1px;
                cursor: pointer;
            }
            .njg-node:hover,
            .njg-node.njg-open{
                fill-opacity: 1;
            }

            .njg-link {
                stroke: #00ff00;
                stroke-width: 2;
                stroke-opacity: .5;
                cursor: pointer;
            }
            .njg-link:hover,
            .njg-link.njg-open{
                stroke-width: 3;
                stroke-opacity: 1
            }
        </style>
    </head>
    <body>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.12/d3.min.js"></script>
        <script src="src/netjsongraph.js"></script>
        <script>d3.netJsonGraph("netjson.json", { defaultStyle: false });</script>
    </body>
    </html>

Contributing
------------

1. Fork it!
2. Create your feature branch: git checkout -b my-new-feature
3. Commit your changes: git commit -am 'Add some feature'
4. Push to the branch: git push origin my-new-feature
5. Submit a pull request :D

License
-------

`BSD 3-Clause License <https://github.com/interop-dev/netjsongraph.js/blob/master/LICENSE>`__.
