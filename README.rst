netjsongraph.js
===============

.. image:: https://coveralls.io/repos/github/netjson/netjsongraph.js/badge.svg
   :target: https://coveralls.io/github/netjson/netjsongraph.js
.. image:: https://travis-ci.org/netjson/netjsongraph.js.svg?branch=dev
   :target: https://travis-ci.org/netjson/netjsongraph.js


.. image:: https://raw.githubusercontent.com/interop-dev/netjsongraph.js/master/docs/netjsongraph-default.png

Leverage the power of `d3.js <http://d3js.org/>`__ and `three.js <https://threejs.org/>`__ to visualize network topology using the
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
    * ``width``: container width, defaults to ``document.innerWidth``
    * ``height``: container height, defaults to ``document.innerHeight``
    * ``el``: container element, defaults to ``"body"``
    * ``metadata``: whether to show `NetJSON <http://netjson.org>`__ ``NetworkGraph`` metadata or not, defaults to ``true``
    * ``defaultStyle``: whether to use the default style or not, defaults to ``true``
    * ``linkDistance``: see `d3 Zoom linkDistance <https://github.com/mbostock/d3/wiki/Force-Layout#linkDistance>`__, defaults to ``50``,
    * ``linkStrength``: see `d3 Zoom linkStrength <https://github.com/mbostock/d3/wiki/Force-Layout#linkStrength>`__, defaults to ``0.2``,
    * ``theta``: see `d3 Zoom theta <https://github.com/mbostock/d3/wiki/Force-Layout#theta>`__, defaults to ``0.8``
    * ``circleRadius``: radius of circles (nodes) in pixel, defalts to ``8``
    * ``onInit``: callback function executed on initialization, params: ``url`` and ``options``
    * ``onLoad``: callback function executed after data has been loaded, params: ``url`` and ``options``
    * ``onEnd``: callback function executed when initial animation is complete, params: ``url`` and ``options``
    * ``onClickNode``: function called when a node is clicked, you can customize it if you need
    * ``onClickLink``: function called when a link is clicked, you can customize it if you need
    * ``initialAnimation``: A flag to disable initial animation, defaults to ``false``
    * ``static``: Is static force layout? see `d3 static layout <https://bl.ocks.org/mbostock/1667139>`__, defaults to ``true``

Example Usage
-------------

Very basic:

.. code-block:: html

    <!DOCTYPE html>
    <html>
        <head>
            <link href="src/netjsongraph.css" rel="stylesheet">
            <!-- theme can be easily customized via css -->
            <link href="dist/netjsongraph-theme.css" rel="stylesheet">
        </head>
        <body>
            <script src="dist/netjsongraph.min.js"></script>
            <script>
                import Netjsongraph from 'netjsongraph.js';
                new Netjsongraph('netjson.json');
            </script>
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
        <link href="dist/netjsongraph-theme.css" rel="stylesheet">
        <style type="text/css">
            body {
                font-family: Arial, sans-serif;
                font-size: 13px;
            }

            #network-graph {
                width: 1000px;
                height: 800px;
                margin: 0 auto;
                border: 1px solid #ccc;
            }
        </style>
    </head>
    <body>
        <div id="network-graph"></div>
        <script src="dist/netjsongraph.js"></script>
        <script>
            import Netjsongraph from 'netjsongraph.js';
            new Netjsongraph("netjson.json", {
                el: document.getElementById('#network-graph')
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
        <script src="dist/netjsongraph.js"></script>
        <script>new Netjsongraph("netjson.json", { defaultStyle: false });</script>
    </body>
    </html>


API
---

set (config)
>>>>>>>>>>>>

* config: ``Object``

Set properties of instance.

container (el)
>>>>>>>>>>>>>>

* el: ``Object``

Set container.

load (data)
>>>>>>>>>>>

* data: ``Object``

Load NetJSON data.

switchTheme (theme)
>>>>>>>>>>>>>>>>>>>

* theme: ``String``

Change theme.

render ()
>>>>>>>>>

Render the force layout.


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
