netjsongraph.js
===============

Experimental NetJSON NetworkGraph visualizer based on d3.js.

**WORK IN PROGRESS**

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

Arguments
---------

*netjsongraph.js* accepts two arguments

1. ``url``: URL to fetch the JSON data from
2. ``options``: javascript object with custom options described below
    * ``el``: container element, defaults to ``"body"``
    * ``zoomExtent``: d3 zoomExtent, defaults to ``[0.25, 5]``
    * ``charge``: d3 charge, defaults to ``-130``
    * ``linkDistance``: ``40``,
    * ``linkStrength``: ``0.2``,
    * ``friction``: ``0.9``,  // d3 default
    * ``chargeDistance``: ``Infinity``,  // d3 default
    * ``theta``: ``0.8``,  // d3 default
    * ``gravity``: ``0.1``,
    * ``linkDistanceFunc``: by default high density areas have longer links, you can tweak this behaviour if you need
    * ``redraw``: functon called when panning and zooming, you can tweak it if you need
    * ``prepareData``: function used to convert NetJSON NetworkGraph to the javascript data structured used internally

Styling
-------

The library at the moment comes with no default styling, you should customize the styling
to your own needs.

Here's an example of how to show green links and dark green nodes
(put this block in your ``<head>``):

.. code-block:: css

    <style type="text/css">
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
