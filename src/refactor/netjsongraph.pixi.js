import * as d3 from 'd3';
import * as PIXI from 'pixi.js';
import netjsonData from '../../examples/data/netjson.json';

const width = 960;
const height = 600;

const stage = new PIXI.Container();
const renderer = PIXI.autoDetectRenderer(width, height, {
  antialias: !0, transparent: !0, resolution: 1 });
const links = new PIXI.Graphics();

stage.addChild(links);
document.body.appendChild(renderer.view);

const colour = (function () {
  let scale = d3.scaleOrdinal(d3.schemeCategory20);
  return (num) => parseInt(scale(num).slice(1), 16);
})();

let simulation = d3.forceSimulation()
    .force('link', d3.forceLink().id((d) => d.id))
    .force('charge', d3.forceManyBody().distanceMax(60))  // custom distance max value
    .force('center', d3.forceCenter(width / 2, height / 2));

netjsonData.nodes.forEach((node) => {
  node.gfx = new PIXI.Graphics();
  node.gfx.lineStyle(1.5, 0xFFFFFF);
  node.gfx.beginFill(colour(node.id));
  node.gfx.drawCircle(0, 0, 5);
  stage.addChild(node.gfx);
});

simulation
  .nodes(netjsonData.nodes)
  .on('tick', ticked);

simulation.force('link')
  .links(netjsonData.links);

function ticked () {
  netjsonData.nodes.forEach((node) => {
    let { x, y, gfx } = node;
    gfx.position = new PIXI.Point(x, y);
  });

  links.clear();
  links.alpha = 0.6;

  netjsonData.links.forEach((link) => {
    let { source, target } = link;
    links.lineStyle(Math.sqrt(link.cost), 0x999999);
    links.moveTo(source.x, source.y);
    links.lineTo(target.x, target.y);
  });

  links.endFill();

  renderer.render(stage);
}

function dragstarted () {
  if (!d3.event.active) simulation.alphaTarget(0.3).restart();
  d3.event.subject.fx = d3.event.subject.x;
  d3.event.subject.fy = d3.event.subject.y;
}

function dragged () {
  d3.event.subject.fx = d3.event.x;
  d3.event.subject.fy = d3.event.y;
}

function dragended () {
  if (!d3.event.active) simulation.alphaTarget(0);
  d3.event.subject.fx = null;
  d3.event.subject.fy = null;
}

d3.select(renderer.view)
  .call(d3.drag()
        .container(renderer.view)
        .subject(() => simulation.find(d3.event.x, d3.event.y))
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended));
