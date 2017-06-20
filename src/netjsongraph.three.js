/**
 * @fileOverview
 * @name netjsongraph.three.js<src>
 * @author GeekPlux
 * @license BSD 3-clause
 * @version 0.1.2
 */
import * as d3 from 'd3';
import * as THREE from 'three';
import { colour, promisify } from './utils.js';

/**
 * Default options
 * @param  {string}     el                  "body"      The container element
 * @param  {bool}       metadata            true        Display NetJSON metadata at startup?
 */
const defaults = {
  width: window.innerWidth,
  height: window.innerHeight,
  url: '',            // The NetJSON file url
  el: document.body,  // container element
  data: {},
  metadata: true,
  defaultStyle: true
};

class Netjsongraph {

  /**
   * Construct function
   * @param {string} url The NetJSON file url
   * @param {Object} config
   */
  constructor (url, config) {
    this.set(config);
    this.url = url;
    this.init();
  }

  /**
   * Set properties of instance
   * @param {Object} config
   */
  set (config) {
    Object.assign(this, defaults, config);
    return this;
  }

  /**
   * Set container
   * @param {Object} el The container element
   * @returns {}
   */
  container (el) {
    this.el = el;
    return this;
  }

  /**
   * Load NetJSON data
   * @param {Object} data
   * @returns {}
   */
  load (data) {
    this.data = data;
    return this;
  }

  /**
   * Init graph
   */
  init () {
    this.fetch(this.url).then(() => this.render());
  }

  /**
   *
   * @param {string} url The NetJSON file url
   */
  fetch (url) {
    if (this.url !== url) this.url = url;
    const fetchJson = promisify(d3, d3.json);
    return fetchJson(this.url)
      .then((data) => { this.data = data; },
            (err) => { if (err) throw err; });
  }

  /**
   * Render force layout
   */
  render () {
    const { width, height, data } = this;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, width, height, 0, 1, 1000);
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true   // perform antialiasing
    });
    renderer.setSize(width, height);
    this.el.appendChild(renderer.domElement);
    camera.position.z = 5;

    data.nodes.forEach((node) => {
      node.geometry = new THREE.CircleBufferGeometry(5, 32);
      node.material = new THREE.MeshBasicMaterial({ color: colour(node.id) });
      node.circle = new THREE.Mesh(node.geometry, node.material);
      scene.add(node.circle);
    });

    data.links.forEach((link) => {
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
      .nodes(data.nodes)
      .on('tick', ticked);

    simulation.force('link')
      .links(data.links);

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

      render(scene, camera);
    }

    function render () {
      requestAnimationFrame(render);
      renderer.render(scene, camera);
    };
  }
}

export default Netjsongraph;
