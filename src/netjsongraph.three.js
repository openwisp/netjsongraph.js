import * as d3 from 'd3';
import * as THREE from 'three';
import { colour } from './utils.js';

const defaults = {
  width: 960,
  height: 600,
  container: document.body,
  data: {}
};

function ticked () {
  data.nodes.forEach((node) => {
    const { x, y, circle } = node;
    circle.position.set(x, y, 0);
  });

  data.links.forEach((link) => {
    const { source, target, line } = link;
    line.geometry.verticesNeedUpdate = true;
    line.geometry.vertices[0] = new THREE.Vector3(source.x, source.y, 0);
    line.geometry.vertices[1] = new THREE.Vector3(target.x, target.y, 0);
  });
}

class Netjsongraph {
  constructor (config) {
    this.set(config);
  }

  set (config) {
    Object.assign(this, defaults, config);
  }

  load (data) {
    this.data = data;
    return this;
  }

  width (w) {
    this.width = w;
    return this;
  }

  height (h) {
    this.height = h;
    return this;
  }

  container (c) {
    this.container = c;
    return this;
  }

  createScene () {
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(0, this.width, this.height, 0, 1, 1000);
    this.renderer = new THREE.WebGLRenderer({alpha: true});
    this.renderer.setSize(this.width, this.height);
    this.container.appendChild(this.renderer.domElement);
    this.camera.position.z = 5;
    return this;
  }

  createPrimitive () {
    this.data.nodes.forEach((node) => {
      node.geometry = new THREE.CircleBufferGeometry(5, 32);
      node.material = new THREE.MeshBasicMaterial({ color: colour(node.id) });
      node.circle = new THREE.Mesh(node.geometry, node.material);
      this.scene.add(node.circle);
    });

    this.data.links.forEach((link) => {
      link.material = new THREE.LineBasicMaterial({ color: 0xAAAAAA });
      link.geometry = new THREE.Geometry();
      link.line = new THREE.Line(link.geometry, link.material);
      this.scene.add(link.line);
    });
    return this;
  }

  forceLayout () {
    this.simulation = d3.forceSimulation()
      .force('link', d3.forceLink().id((d) => d.id))
      .force('charge', d3.forceManyBody().distanceMax(100))  // custom distance max value
      .force('center', d3.forceCenter(this.width / 2, this.height / 2));

    this.simulation
      .nodes(this.data.nodes)
      .on('tick', ticked);

    this.simulation.force('link')
      .links(this.data.links);

    return this;
  }

  render () {
    requestAnimationFrame(this.render);
    this.renderer.render(this.scene, this.camera);
  }
}

export default Netjsongraph;
