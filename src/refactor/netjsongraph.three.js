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
  node.geometry = new THREE.CircleBufferGeometry(5, 32);
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
      .force('charge', d3.forceManyBody().distanceMax(100))  // custom distance max value
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
    line.geometry.verticesNeedUpdate = true;
    line.geometry.vertices[0] = new THREE.Vector3(source.x, source.y, 0);
    line.geometry.vertices[1] = new THREE.Vector3(target.x, target.y, 0);
  });

  render(scene, camera);
}

function render () {
  requestAnimationFrame(render);
  renderer.render(scene, camera);
};