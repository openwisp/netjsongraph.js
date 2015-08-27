// version 0.1
(function() {
        /**
         * vanilla JS implementation of jQuery.extend()
         */
        d3._extend = function(defaults, options) {
                var extended = {},
                prop;
                for(prop in defaults) {
                        if(Object.prototype.hasOwnProperty.call(defaults, prop)) {
                                extended[prop] = defaults[prop];
                        }
                }
                for(prop in options) {
                        if(Object.prototype.hasOwnProperty.call(options, prop)) {
                                extended[prop] = options[prop];
                        }
                }
                return extended;
        };

        /**
         * @function
         *   @name d3._pxToNumber
         * Convert strings like "10px" to 10
         *
         * @param  {string}       val                     The value to convert
         * @return {int}                                  The converted integer
         */
        d3._pxToNumber = function(val) {
                return parseFloat(val.replace('px'));
        };

        /**
         * @function
         *   @name d3._windowHeight
         *
         * Get window height
         *
         * @return  {int}                                The window innerHeight
         */
        d3._windowHeight = function() {
                return window.innerHeight || document.documentElement.clientHeight || 600;
        };

        /**
         * @function
         *   @name d3._getPosition
         *
         * Get the position of `element` relative to `container`
         *
         * @param  {object}              element
         * @param  {object}              container
         */
        d3._getPosition = function(element, container) {
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

        /**
        * netjsongraph.js main function
        *
        * @constructor
        * @param  {string}      url                     The NetJSON file url
        * @param  {object}      opts                    The object with parameters to override {@link d3.netJsonGraph.opts}
        */
        d3.netJsonGraph = function(url, opts) {
                /**
                 * Default options
                 *
                 * @param  {string}     el                      "body"          The container element                                                                  el: "body" [description]
                 * @param  {bool}       metadata                true            Display NetJSON metadata at startup?
                 * @param  {bool}       defaultStyle            true            Use css style?
                 * @param  {int}        tooltipDelay            0               The delay before showing tooltip
                 * @param  {bool}       animationAtStart        false           Animate nodes or not on load
                 * @param  {array}      scaleExtent             [0.25, 5]       The zoom scale's allowed range. @see {@link https://github.com/mbostock/d3/wiki/Zoom-Behavior#scaleExtent}
                 * @param  {int}        charge                  -130            The charge strength to the specified value. @see {@link https://github.com/mbostock/d3/wiki/Force-Layout#charge}
                 * @param  {int}        linkDistance            40              The target distance between linked nodes to the specified value. @see {@link https://github.com/mbostock/d3/wiki/Force-Layout#linkDistance}
                 * @param  {float}      linkStrength            0.2             The strength (rigidity) of links to the specified value in the range. @see {@link https://github.com/mbostock/d3/wiki/Force-Layout#linkStrength}
                 * @param  {float}      friction                0.9             The friction coefficient to the specified value. @see {@link https://github.com/mbostock/d3/wiki/Force-Layout#friction}
                 * @param  {string}     chargeDistance          Infinity        The maximum distance over which charge forces are applied. @see {@link https://github.com/mbostock/d3/wiki/Force-Layout#chargeDistance}
                 * @param  {float}      theta                   0.8             The Barnes–Hut approximation criterion to the specified value. @see {@link https://github.com/mbostock/d3/wiki/Force-Layout#theta}
                 * @param  {float}      gravity                 0.1             The gravitational strength to the specified numerical value. @see {@link https://github.com/mbostock/d3/wiki/Force-Layout#gravity}
                 * @param  {function}   linkDistanceFunc                        By default high density areas have longer links
                 * @param  {function}   redraw                                  Called when panning and zooming
                 * @param  {function}   prepareData                             Used to convert NetJSON NetworkGraph to the javascript data
                 * @param  {function}   onClickNode                             Called when a node is clicked
                 * @param  {function}   onClickLink                             Called when a link is clicked
                 */
                opts = d3._extend({
                        el: "body",
                        metadata: true,
                        defaultStyle: true,
                        tooltipDelay: 0,
                        animationAtStart: false,
                        scaleExtent: [0.25, 5],
                        charge: -130,
                        linkDistance: 40,
                        linkStrength: 0.2,
                        friction: 0.9,  // d3 default
                        chargeDistance: Infinity,  // d3 default
                        theta: 0.8,  // d3 default
                        gravity: 0.1,
                        /**
                         * @function
                         * @name linkDistanceFunc
                         *
                         * By default, high density areas have longer links
                         */
                        linkDistanceFunc: function(d){
                                var val = opts.linkDistance;
                                if(d.source.linkCount >= 4 && d.target.linkCount >= 4) {
                                        return val * 2;
                                }
                                return val;
                        },
                        /**
                         * @function
                         * @name redraw
                         *
                         * Called on zoom and pan
                         */
                        redraw: function() {
                                panner.attr("transform",
                                        "translate(" + d3.event.translate + ") " +
                                                "scale(" + d3.event.scale + ")"
                                        );
                                tooltip.style("visibility", "hidden");
                        },

                        /**
                         * @function
                         * @name prepareData
                         *
                         * Convert NetJSON NetworkGraph to the data structure consumed by d3
                         *
                         * @param graph {object}
                         */
                        prepareData: function(graph) {
                                var nodesMap = {},
                                nodes = graph.nodes.slice(), // copy
                                links = graph.links.slice(), // copy
                                nodes_length = graph.nodes.length,
                                links_length = graph.links.length;

                                for(var i = 0; i < nodes_length; i++) {
                                        // count how many links every node has
                                        nodes[i].linkCount = 0;
                                        nodesMap[nodes[i].id] = i;
                                }
                                for(var c = 0; c < links_length; c++) {
                                        var sourceIndex = nodesMap[links[c].source],
                                        targetIndex = nodesMap[links[c].target];
                                        // ensure source and target exist
                                        //
                                        if(!nodes[sourceIndex]) { throw("source '" + links[c].source + "' not found"); }
                                        if(!nodes[targetIndex]) { throw("target '" + links[c].target + "' not found"); }
                                        links[c].source = nodesMap[links[c].source];
                                        links[c].target = nodesMap[links[c].target];
                                        // add link count to both ends
                                        nodes[sourceIndex].linkCount++;
                                        nodes[targetIndex].linkCount++;
                                }
                                return { "nodes": nodes, "links": links };
                        },

                        /**
                         * @function
                         * @name onClickNode
                         *
                         * Called when a node is clicked
                         */
                        onClickNode: function(n) {
                                var overlay = d3.select("#svg-overlay"),
                                overlayInner = d3.select("#svg-overlay > .inner"),
                                html = "<p><b>id</b>: " + n.id + "</p>";
                                if(n.label) { html += "<p><b>label</b>: " + n.label + "</p>"; }
                                if(n.properties) {
                                        for(var key in n.properties) {
                                                if(!n.properties.hasOwnProperty(key)) { continue; }
                                                key = key.replace("_", " ");
                                                html += "<p><b>"+key+"</b>: " + n.properties[key] + "</p>";
                                        }
                                }
                                if(n.linkCount) { html += "<p><b>links</b>: " + n.linkCount + "</p>"; }
                                overlayInner.html(html);
                                overlay.classed("hidden", false);
                        },

                        /**
                         * @function
                         * @name onClickLink
                         *
                         * Called when a node is clicked
                         */
                        onClickLink: function(l) {
                                var overlay = d3.select("#svg-overlay"),
                                overlayInner = d3.select("#svg-overlay > .inner"),
                                html = "<p><b>source</b>: " + (l.source.label || l.source.id) + "</p>";
                                html += "<p><b>target</b>: " + (l.target.label || l.target.id) + "</p>";
                                html += "<p><b>cost</b>: " + l.cost + "</p>";
                                if(l.properties) {
                                        for(var key in l.properties) {
                                                if(!l.properties.hasOwnProperty(key)) { continue; }
                                                key = key.replace("_", " ");
                                                html += "<p><b>"+key+"</b>: " + l.properties[key] + "</p>";
                                        }
                                }
                                overlayInner.html(html);
                                overlay.classed("hidden", false);
                        }
                }, opts);
                if(!opts.animationAtStart) {
                        opts.linkStrength = 2;
                        opts.friction = 0.3;
                        opts.gravity = 0;
                }

                if(opts.el == "body") {
                        var body = d3.select(opts.el),
                        rect = body.node().getBoundingClientRect();
                        if (d3._pxToNumber(d3.select("body").style("height")) < 60) {
                                body.style("height", d3._windowHeight() - rect.top - rect.bottom + "px");
                        }
                }
                var el = d3.select(opts.el).style("position", "relative"),
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
                        .style("position", "absolute"),
                svg = d3.select(opts.el + " svg"),
                drag = force.drag(),
                // create tooltip div
                tooltip = d3.select(opts.el).append("div").attr("class", "tooltip"),
                overlay = d3.select(opts.el).append("div").attr("class", "overlay"),
                closeOverlay = overlay.append("a").attr("class", "close"),
                overlayInner = overlay.append("div").attr("class", "inner"),
                metadata = d3.select(opts.el).append("div").attr("class", "metadata"),
                metadataInner = metadata.append("div").attr("class", "inner"),
                closeMetadata = metadata.append("a").attr("class", "close"),
                // The container of ungrouped networks json structure
                str = [],
                selected = [],

                /**
                 * @function
                 * @name onMouseOverNode
                 */
                onMouseOverNode = function(n) {
                        var place = function(tooltip, self, svg, zoom) {
                                // position of current element relative to svg container
                                var pos = d3._getPosition(d3.select(self), svg),
                                // find horizontal and vertical offsets
                                xOffset = (tooltip.node().getBoundingClientRect().width/2) - pos.width/2,
                                yOffset = 1 + zoom.scale() / 5;
                                // position tooltip accordingly
                                tooltip.style({
                                        "left": Math.round(pos.left - xOffset) + "px",
                                        "top": pos.top - 25 * yOffset + "px"
                                }).classed("hidden", false);
                        };

                        var self = this;
                        tooltip.text(n.label || n.id);
                        // use css "display" property to
                        // control whether mouse has moved out
                        // before the delayTooltip time has passed
                        // (mouseout event sets "display" back to "none")
                        tooltip.style("display", "block");
                        if(opts.tooltipDelay === 0) {
                                place(tooltip, self, svg, zoom);
                        } else {
                                setTimeout(function() {
                                        place(tooltip, self, svg, zoom);
                                }, opts.tooltipDelay);
                        }

                        // tooltip.classed("hidden", false);
                },
                /**
                 * @function
                 * @name onMouseOutNode
                 */
                onMouseOutNode = function(){
                        tooltip.classed("hidden", true);
                };


                /**
                 * Parse the provided json file
                 * and call processJson() function
                 *
                 * @param  {string}     url             The provided json file
                 * @param  {function}   error
                 */
                d3.json(url, function(error, graph) {
                        if(error) { throw error; }
                        /**
                         * Check if the json contains a NetworkCollection
                         */
                        if(graph.type === "NetworkCollection") {
                                // console.log("Provided json is grouped!");

                                var selectGroup = body.append("div").attr("id", "selectGroup"),
                                select = selectGroup
                                         .append("select")
                                         .attr("id", "select");
                                str = graph;
                                select.append("option").attr({
                                        "value": "",
                                        "selected": "selected",
                                        "name": "default",
                                        "disabled": "disabled"
                                }).html("Choose the network to display");
                                graph.collection.forEach(function(structure) {
                                        select.append("option").attr("value", structure.type).html(structure.type);
                                        // Collect each network json structure
                                        selected[structure.type] = structure;
                                });
                                select.on("change", function() {
                                        selectGroup.attr("class", "hidden");
                                        // console.info("Selected \"" + this.value + "\" network");
                                        // Call selected json structure
                                        processJson(selected[this.options[this.selectedIndex].value]);
                                });
                        } else {
                                // console.log("Provided json is not grouped");
                                processJson(graph);
                        }
                });

                processJson = function(graph) {
                        /**
                         * Init netJsonGraph
                         */
                        init = function(url, opts) {
                                d3.netJsonGraph(url, opts);
                        };

                        /**
                         * Remove all instances
                         */
                        destroy = function() {
                                force.stop();
                                d3.select("#selectGroup").remove();
                                d3.select(".svg-tooltip").remove();
                                d3.select("#svg-overlay").remove();
                                d3.select("#svg-metadata").remove();
                                overlay.remove();
                                overlayInner.remove();
                                metadata.remove();
                                svg.remove();
                                node.remove();
                                link.remove();
                                nodes = [];
                                links = [];
                        };

                        /**
                         * Destroy and e-init all instances
                         * @return {[type]} [description]
                         */
                        reInit = function() {
                                destroy();
                                init(url, opts);
                        };

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

                        force.nodes(nodes).links(links).start();

                        var link = panner.selectAll(".link")
                                .data(links)
                                .enter().append("line")
                                .attr("class", "link")
                                .on("click", opts.onClickLink),
                        node = panner.selectAll(".node")
                                .data(nodes)
                                .enter().append("circle")
                                .attr("class", "node")
                                .attr("r", 7)
                                .on("mouseover", onMouseOverNode)
                                .on("mouseout", onMouseOutNode)
                                .on("click", opts.onClickNode)
                                .call(drag);

                        // Close overlay
                        closeOverlay.on("click", function() {
                                overlay.classed("hidden", true);
                        });
                        // Close Metadata panel
                        closeMetadata.on("click", function() {
                                reInit();
                        });

                        /**
                         * STYLES
                         */
                        if(opts.defaultStyle) {
                                var colors = d3.scale.category20c();
                                node.style({
                                        "fill": function(d){ return colors(d.linkCount); },
                                        "cursor": "pointer"
                                });
                                // Link style
                                link.attr("class", "link");
                                // Tooltip style
                                tooltip.attr("class", "svg-tooltip");
                                // Overlay style
                                overlay.attr("id", "svg-overlay").attr("class", "hidden");
                                // Metadata style
                                metadata.attr("id", "svg-metadata");
                        }

                        if(opts.metadata) {
                                var attrs = ["protocol",
                                             "version",
                                             "revision",
                                             "metric",
                                             "router_id",
                                             "topology_id"],
                                html = "";
                                if(graph.label) {
                                        html += "<h3>" + graph.label + "</h3>";
                                }
                                for(var i in attrs) {
                                        var attr = attrs[i];
                                        if(graph[attr]) {
                                                html += "<p><b>" + attr + "</b>: <span>" + graph[attr] + "</span></p>";
                                        }
                                }
                                metadataInner.html(html);
                                metadata.classed("hidden", false);
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

                        return force;
                };
        };
})();
