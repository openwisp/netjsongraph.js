import * as d3 from 'd3';
import * as THREE from 'three';
import netjsonData from '../../examples/data/netjson.json';

const width = 960;
const height = 600;

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(0, width, height, 0, 1, 1000);
const renderer = new THREE.WebGLRenderer({alpha: true});
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);
camera.position.z = 5;

const colour = (function () {
  const scale = d3.scaleOrdinal(d3.schemeCategory20);
  return (num) => parseInt(scale(num).slice(1), 16);
})();

netjsonData.nodes.forEach((node) => {
  node.geometry = new THREE.CircleBufferGeometry(10, 32);
  node.material = new THREE.MeshBasicMaterial({ color: colour(node.id) });
  node.circle = new THREE.Mesh(node.geometry, node.material);
  scene.add(node.circle);
});

netjsonData.links.forEach((link) => {
  link.material = new THREE.LineBasicMaterial({ color: 0xAAAAAA });
  link.geometry = new THREE.Geometry();
  link.line = new THREE.Line(link.geometry, link.material);
  scene.add(link.line);
});

const simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id((d) => d.id))
      .force('charge', d3.forceManyBody().distanceMax(60))  // custom distance max value
      .force('center', d3.forceCenter(width / 2, height / 2));

simulation
  .nodes(netjsonData.nodes)
  .on('tick', ticked);

simulation.force('link')
  .links(netjsonData.links);

function ticked () {
  netjsonData.nodes.forEach((node) => {
    const { x, y, circle } = node;
    circle.position.set(x, y, 0);
  });

  netjsonData.links.forEach((link) => {
    const { source, target, line } = link;
    line.geometry.vertices.push(new THREE.Vector3(source.x, source.y, 0));
    line.geometry.vertices.push(new THREE.Vector3(target.x, target.y, 0));
  });

  render(scene, camera);
}

function render () {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
};

// function dragstarted () {
//   if (!d3.event.active) simulation.alphaTarget(0.3).restart();
//   d3.event.subject.fx = d3.event.subject.x;
//   d3.event.subject.fy = d3.event.subject.y;
// }

// function dragged () {
//   d3.event.subject.fx = d3.event.x;
//   d3.event.subject.fy = d3.event.y;
// }

// function dragended () {
//   if (!d3.event.active) simulation.alphaTarget(0);
//   d3.event.subject.fx = null;
//   d3.event.subject.fy = null;
// }

// d3.select(renderer.view)
//   .call(d3.drag()
//         .container(renderer.view)
//         .subject(() => simulation.find(d3.event.x, d3.event.y))
//         .on('start', dragstarted)
//         .on('drag', dragged)
//         .on('end', dragended));
