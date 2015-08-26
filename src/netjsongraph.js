// version 0.1
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
        // default options, overridable
        opts = d3._extend({
            el: "body",
            metadata: true,
            defaultStyle: true,
            tooltipDelay: 300,
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
                    // ensure source and target exist
                    if (!nodes[sourceIndex]) { throw("source '" + links[c].source + "' not found"); }
                    if (!nodes[targetIndex]) { throw("target '" + links[c].target + "' not found"); }
                    links[c].source = sourceIndex;
                    links[c].target = targetIndex;
                    // add link count to both ends
                    nodes[sourceIndex].linkCount++;
                    nodes[targetIndex].linkCount++;
                }
                return { "nodes": nodes, "links": links };
            },
            /**
             * called when a node is clicked
             */
            onClickNode: function (n) {
                var html = "<p><b>id</b>: " + n.id + "</p>";
                if (n.label) { html += "<p><b>label</b>: " + n.label + "</p>"; }
                if (n.properties) {
                    for (key in n.properties) {
                        if (!n.properties.hasOwnProperty(key)) { continue; }
                        key = key.replace("_", " ");
                        html += "<p><b>"+key+"</b>: " + n.properties[key] + "</p>";
                    }
                }
                if (n.linkCount) { html += "<p><b>links</b>: " + n.linkCount + "</p>"; }
                overlayInner.html(html);
                overlay.style("display", "block");
                // set "open" class to current node
                removeOpenClass();
                d3.select(this).attr("class", "njg-node njg-open");
            },
            /**
             * called when a node is clicked
             */
            onClickLink: function (l) {
                var html = "<p><b>source</b>: " + (l.source.label || l.source.id) + "</p>";
                html += "<p><b>target</b>: " + (l.target.label || l.target.id) + "</p>";
                html += "<p><b>cost</b>: " + l.cost + "</p>";
                if (l.properties) {
                    for (key in l.properties) {
                        if (!l.properties.hasOwnProperty(key)) { continue; }
                        key = key.replace("_", " ");
                        html += "<p><b>"+key+"</b>: " + l.properties[key] + "</p>";
                    }
                }
                overlayInner.html(html);
                overlay.style("display", "block");
                // set "open" class to current link
                removeOpenClass();
                d3.select(this).attr("class", "njg-link njg-open");
            }
        }, opts);

        if (opts.el == "body" && d3._pxToNumber(d3.select("body").style("height")) < 60) {
            var body = d3.select("body"),
                rect = body.node().getBoundingClientRect();
            body.style("height", d3._windowHeight() - rect.top - rect.bottom + "px");
        }

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
                        .attr("class", "njg-tooltip"),
            overlay = d3.select(opts.el)
                        .append("div")
                        .attr("class", "njg-overlay"),
            closeOverlay = overlay.append("a")
                                  .attr("class", "njg-close")
                                  .text("\u2716"),
            overlayInner = overlay.append("div")
                                  .attr("class", "njg-inner"),
            metadata = d3.select(opts.el)
                         .append("div")
                         .attr("class", "njg-metadata"),
            metadataInner = metadata.append("div")
                                    .attr("class", "njg-inner"),
            closeMetadata = metadata.append("a")
                                    .attr("class", "njg-close")
                                    .text("\u2716"),
            onMouseOverNode = function(n) {
                var self = this;
                tooltip.text(n.label || n.id);
                // use css "display" property to
                // control wether mouse has moved out
                // before the delayTooltip time has passed
                // (mouseout event sets "display" back to "none")
                tooltip.style("display", "block");
                setTimeout(function () {
                    if (tooltip.style("display") != "block") {
                        return;
                    }
                    // position of current element relative to svg container
                    var pos = getPosition(d3.select(self), svg),
                    // find horizontal and vertical offsets
                        xOffset = (tooltip.node().getBoundingClientRect().width/2) - pos.width/2,
                        yOffset = 1 + zoom.scale() / 5;
                    // position tooltip accordingly
                    return tooltip.style("left", pos.left - xOffset + "px")
                                  .style("top", pos.top - 25 * yOffset + "px")
                                  .style("visibility", "visible");
                }, opts.tooltipDelay);
            },
            onMouseOutNode = function(){
                tooltip.style({
                    "visibility": "hidden",
                    "display": "none"
                });
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
            },
            removeOpenClass = function () {
                // remove open class to nodes and links
                d3.selectAll(".njg-node.njg-open").attr("class", "njg-node");
                d3.selectAll(".njg-link.njg-open").attr("class", "njg-link");
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
                d3.select(this).on("mouseover", onMouseOverNode);
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
                             .attr("class", "njg-link")
                             .on("click", opts.onClickLink),
                node = panner.selectAll(".node")
                             .data(nodes)
                             .enter().append("circle")
                             .attr("class", "njg-node")
                             .attr("r", 7)
                             .on("mouseover", onMouseOverNode)
                             .on("mouseout", onMouseOutNode)
                             .on("click", opts.onClickNode)
                             .call(drag);

            closeOverlay.on("click", function () {
                removeOpenClass();
                overlay.style("display", "none");
            });
            closeMetadata.on("click", function () {
                metadata.style("display", "none");
            });

            // default style
            if (opts.defaultStyle) {
                var colors = d3.scale.category20c();
                node.style({
                    "fill": function(d){ return colors(d.linkCount); }
                });
            }

            if (opts.metadata) {
                var attrs = ["protocol", "version", "revision",
                             "metric", "router_id", "topology_id"],
                    html = "";
                if (graph.label) {
                    html += "<h3>" + graph.label + "</h3>";
                }
                for (i in attrs) {
                    var attr = attrs[i];
                    if (graph[attr]) {
                        html += "<p><b>" + attr + "</b>: <span>" + graph[attr] + "</span></p>";
                    }
                }
                metadataInner.html(html);
                metadata.style("display", "block");
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
