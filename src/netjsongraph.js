(function () {
    /**
     * vanilla JS implementation
     * of jQuery.extend()
     */
    d3._extend = function (defaults, options) {
        var extended = {},
            prop;
        for (prop in defaults) {
            if (Object.prototype.hasOwnProperty.call(defaults, prop)) {
                extended[prop] = defaults[prop];
            }
        }
        for (prop in options) {
            if (Object.prototype.hasOwnProperty.call(options, prop)) {
                extended[prop] = options[prop];
            }
        }
        return extended;
    };

    /**
     * converts strings like "10px" to 10
     */
    d3._pxToNumber = function (val) {
        return parseFloat(val.replace('px'));
    };

    /**
     * gets window height
     */
    d3._windowHeight = function () {
        return window.innerHeight || document.documentElement.clientHeight || 600;
    };

    /**
     * netjsongraph.js main function
     */
    d3.netJsonGraph = function(url, opts) {
        if (d3._pxToNumber(d3.select("body").style("height")) < 60) {
            d3.select("body").style("height", d3._windowHeight() + "px");
        }

        // default options, overridable
        opts = d3._extend({
            el: "body",
            defaultStyle: true,
            scaleExtent: [0.25, 5],
            charge: -130,
            linkDistance: 40,
            linkStrength: 0.2,
            friction: 0.9,  // d3 default
            chargeDistance: Infinity,  // d3 default
            theta: 0.8,  // d3 default
            gravity: 0.1,
            // by default, high density areas have longer links
            linkDistanceFunc: function(d){
                var val = opts.linkDistance;
                if (d.source.linkCount >= 4 && d.target.linkCount >= 4) {
                    return val * 2;
                }
                return val;
            },
            // called on zoom and pan
            redraw: function () {
                panner.attr("transform", "translate(" + d3.event.translate + ") " +
                                         "scale(" + d3.event.scale + ")");
                tooltip.style("visibility", "hidden");
            },
            /**
             * converts NetJSON NetworkGraph
             * to the data structure consumed by d3
             */
            prepareData: function(graph) {
                var nodesMap = {},
                    nodes = graph.nodes.slice(), // copy
                    links = graph.links.slice(), // copy
                    nodes_length = graph.nodes.length;
                links_length = graph.links.length;
                for (var i = 0; i < nodes_length; i++) {
                    // count how many links every node has
                    nodes[i].linkCount = 0;
                    nodesMap[nodes[i].id] = i;
                }
                for (var c = 0; c < links_length; c++) {
                    var sourceIndex = nodesMap[links[c].source],
                        targetIndex = nodesMap[links[c].target];
                    links[c].source = sourceIndex;
                    links[c].target = targetIndex;
                    // add link count to both ends
                    nodes[sourceIndex].linkCount++;
                    nodes[targetIndex].linkCount++;
                }
                return { "nodes": nodes, "links": links };
            }
        }, opts);

        var el = d3.select(opts.el)
                   .style("position", "relative"),
            width = d3._pxToNumber(el.style('width')),
            height = d3._pxToNumber(el.style('height')),
            force = d3.layout.force()
                      .charge(opts.charge)
                      .linkStrength(opts.linkStrength)
                      .linkDistance(opts.linkDistanceFunc)
                      .friction(opts.friction)
                      .chargeDistance(opts.chargeDistance)
                      .theta(opts.theta)
                      .gravity(opts.gravity)
                      // width is easy to get, if height is 0 take the height of the body
                      .size([width, height]),
            zoom = d3.behavior.zoom().scaleExtent(opts.scaleExtent),
            // panner is the element that allows zooming and panning
            panner = el.append("svg")
                       .attr("width", width)
                       .attr("height", height)
                       .call(zoom.on("zoom", opts.redraw))
                       .append("g")
                       .style("position", "relative"),
            svg = d3.select(opts.el+' svg'),
            drag = force.drag(),
            // create tooltip div
            tooltip = d3.select(opts.el)
                        .append("div")
                        .attr("class", "tooltip")
                        .style("position", "absolute")
                        .style("z-index", "10")
                        .style("visibility", "hidden"),
            nodeMouseOver = function(n) {
                tooltip.text(n.label || n.id);
                // position of current element relative to svg container
                var pos = getPosition(d3.select(this), svg),
                // find horizontal and vertical offsets
                    xOffset = (tooltip.node().getBoundingClientRect().width/2) - pos.width/2,
                    yOffset = 1 + zoom.scale() / 5;
                // position tooltip accordingly
                return tooltip.style("left", pos.left - xOffset + "px")
                              .style("top", pos.top - 25 * yOffset + "px")
                              .style("visibility", "visible");
            },
            nodeMouseOut = function(){
                tooltip.style("visibility", "hidden");
            },
            /**
             * get position of `element` relative to `container`
             */
            getPosition = function(element, container) {
                var n = element.node(),
                    nPos = n.getBoundingClientRect();
                    cPos = container.node().getBoundingClientRect();
                return {
                    top: nPos.top - cPos.top,
                    left: nPos.left - cPos.left,
                    width: nPos.width,
                    bottom: nPos.bottom - cPos.top,
                    height: nPos.height,
                    right: nPos.right - cPos.left
                };
            };

        d3.json(url, function(error, graph) {
            if (error) { throw error; }

            var data = opts.prepareData(graph),
                links = data.links,
                nodes = data.nodes;

            // disable some transitions while dragging
            drag.on('dragstart', function(n){
                d3.event.sourceEvent.stopPropagation();
                d3.select(this).on("mouseover", null);
                zoom.on('zoom', null);
            })
            // re-enable transitions when dragging stops
            .on('dragend', function(n){
                d3.select(this).on("mouseover", nodeMouseOver);
                zoom.on('zoom', opts.redraw);
            })
            .on("drag", function(d) {
                // avoid pan & drag conflict
                d3.select(this).attr("x", d.x = d3.event.x).attr("y", d.y = d3.event.y);
            });

            force.nodes(nodes)
                 .links(links)
                 .start();

            var link = panner.selectAll(".link")
                             .data(links)
                             .enter().append("line")
                             .attr("class", "link"),
                node = panner.selectAll(".node")
                             .data(nodes)
                             .enter().append("circle")
                             .attr("class", "node")
                             .attr("r", 7)
                             .on("mouseover", nodeMouseOver)
                             .on("mouseout", nodeMouseOut)
                             .call(drag);

            // default style
            if (opts.defaultStyle) {
                var colors = d3.scale.category20c();
                node.style({
                    "fill": function(d){ return colors(d.linkCount); },
                    "cursor": "pointer"
                });
                link.style({
                    "stroke": "#999",
                    "stroke-width": 2,
                    "stroke-opacity": 0.4,
                    "cursor": "pointer"
                });
                tooltip.style({
                    "background": "rgba(0, 0, 0, 0.5)",
                    "color": "#fff",
                    "padding": "5px 10px",
                    "border-radius": "3px",
                    "font-family": "Arial, sans-serif",
                    "font-size": "13px"
                });
            }

            force.on("tick", function() {
                link.attr("x1", function(d) {
                        return d.source.x;
                    })
                    .attr("y1", function(d) {
                        return d.source.y;
                    })
                    .attr("x2", function(d) {
                        return d.target.x;
                    })
                    .attr("y2", function(d) {
                        return d.target.y;
                    });

                node.attr("cx", function(d) {
                        return d.x;
                    })
                    .attr("cy", function(d) {
                        return d.y;
                    });
            })
            .on("end", function(){
                force.stop();
            });
        });

        return force;
    };
})();
