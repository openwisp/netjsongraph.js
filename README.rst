netjsongraph.js
===============

Experimental NetJSON NetworkGraph visualizer based on `d3.js <http://d3js.org/>`__.

**WORK IN PROGRESS**

Arguments
---------

*netjsongraph.js* accepts two arguments

1. ``url`` (**required**, string): URL to fetch the JSON data from
2. ``options`` (optional, object): custom options described below
    * ``el``: container element, defaults to ``"body"``
    * ``scaleExtent``: see `d3 Zoom scaleExtent <https://github.com/mbostock/d3/wiki/Zoom-Behavior#scaleExtent>`__, defaults to ``[0.25, 5]``
    * ``charge``: see `d3 Zoom charge <https://github.com/mbostock/d3/wiki/Force-Layout#charge>`__, defaults to ``-130``
    * ``linkDistance``: see `d3 Zoom linkDistance <https://github.com/mbostock/d3/wiki/Force-Layout#linkDistance>`__, defaults to ``40``,
    * ``linkStrength``: see `d3 Zoom linkStrength <https://github.com/mbostock/d3/wiki/Force-Layout#linkStrength>`__, defaults to ``0.2``,
    * ``friction``: see `d3 Zoom friction <https://github.com/mbostock/d3/wiki/Force-Layout#friction>`__, defaults to ``0.9``
    * ``chargeDistance``: see `d3 Zoom chargeDistance <https://github.com/mbostock/d3/wiki/Force-Layout#chargeDistance>`__, defaults to ``Infinity``
    * ``theta``: see `d3 Zoom theta <https://github.com/mbostock/d3/wiki/Force-Layout#theta>`__, defaults to ``0.8``
    * ``gravity``: see `d3 Zoom gravity <https://github.com/mbostock/d3/wiki/Force-Layout#gravity>`__, defaults to ``0.1``
    * ``linkDistanceFunc``: by default high density areas have longer links, you can tweak this behaviour if you need
    * ``redraw``: functon called when panning and zooming, you can tweak it if you need
    * ``prepareData``: function used to convert NetJSON NetworkGraph to the javascript data structured used internally, you won't need to modify it in most cases


Example Usage
-------------

Very basic:

.. code-block:: html

    <body>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min.js"></script>
        <script src="src/netjsongraph.js"></script>
        <script>d3.netJsonGraph("./resources/netjson.json");</script>
    </body>

Show graph in a container:

.. code-block:: html

    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
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

Manipulate the graph as you prefer:

    .. code-block:: javascript

        // initialize with custom options
        force = d3.netJsonGraph("./resources/netjson.json", {
            scaleExtent: [1, 8],
            charge: -200,
            linkDistance: 50,
            linkStrength: 1
        });
        // control graph
        force.stop()

Styling
-------

The library at the moment comes with no default styling, you should customize the styling
to your own needs.

Here's an example of how to show green links and dark green nodes
(put this block in your ``<head>``):

.. code-block:: html

    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style type="text/css">
            body {
                font-family: Arial, sans-serif;
                font-size: 13px;
            }

            .node {
                fill: #008000;
                fill-opacity: 0.8;
                stroke: #008000;
                stroke-width: 1px;
                cursor: pointer;
            }
            .node:hover {
                fill-opacity: 1;
            }

            .link {
                stroke: #00ff00;
                stroke-width: 2;
                stroke-opacity: .5;
                cursor: pointer;
            }
            .link:hover{
                stroke-width: 3;
                stroke-opacity: 1
            }

            .tooltip {
                background: rgba(0, 0, 0, 0.75);
                color: #fff;
                padding: 5px 10px;
                border-radius: 3px;
            }
        </style>
    </head>
    <body>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.5/d3.min.js"></script>
        <script src="src/netjsongraph.js"></script>
        <script>d3.netJsonGraph("netjson.json");</script>
    </body>
    </html>
