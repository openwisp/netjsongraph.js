/**
 * @fileOverview
 * @name netjsongraph.three.js<src>
 * @author GeekPlux
 * @license BSD 3-clause
 * @version 0.1.2
 */
import * as d3 from 'd3';
import * as THREE from 'three';
import 'normalize.css';  /* eslint-disable */
import './netjsongraph.three.css';
import EventsController from './events_controller.js';
import { colour, promisify } from './utils.js';

const defaultWidth = window.innerWidth;
const defaultHeight = window.innerHeight;

/**
 * Default options
 * @param  {string}     el                  "body"      The container element
 * @param  {boolean}    metadata            true        Display NetJSON metadata at startup?
 * @param  {boolean}    defaultStyle        true        Use default css style?
 * @param  {array}      scaleExtent         [0.25, 5]   The zoom scale's allowed range. @see {@link https://github.com/d3/d3-zoom#zoom_scaleExtent}
 */
const defaults = {
  width: defaultWidth,
  height: defaultHeight,
  url: '',            // The NetJSON file url
  el: document.body,  // container element
  data: {},
  metadata: true,
  defaultStyle: true,
  scaleExtent: [0.25, 5],

  scene: new THREE.Scene(),
  camera: new THREE.OrthographicCamera(0, defaultWidth, defaultHeight, 0, 1, 1000),
  renderer: new THREE.WebGLRenderer({
    alpha: true,
    antialias: true   // perform antialiasing
  })
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
    this.fetch(this.url).then(() => {
      this.toggleMetadata();
      this.switchTheme();
      this.render();
      this.enableZoom();
      window.addEventListener('resize', this.onWindowResize.bind(this), false);
    });
  }

  /**
   * Fetch data from url
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
   * Toggle metadata information panel
   */
  toggleMetadata () {
    const metaDom = d3.select('#metadata');

    /**
     * Check whether it is showed on canvas
     */
    if (document.getElementById('metadata')) {
      if (metaDom.style('display') === 'none') {
        metaDom.style('display', 'block');
      } else metaDom.style('display', 'none');
      return;
    }

    const metaDomStr = `
      <div class="metadata" id="metadata">
        <ul class="meta-list">
          <li class="meta-item label"><strong>Label</strong>: ${this.data.label}</li>
          <li class="meta-item metric"><strong>Metric</strong>: ${this.data.metric}</li>
          <li class="meta-item protocol"><strong>Protocol</strong>: ${this.data.protocol}</li>
          <li class="meta-item type"><strong>Type</strong>: ${this.data.type}</li>
          <li class="meta-item version"><strong>Version</strong>: ${this.data.version}</li>
          <li class="meta-item nodes"><strong>Nodes</strong>: ${this.data.nodes.length}</li>
          <li class="meta-item links"><strong>Links</strong>: ${this.data.links.length}</li>
        </ul>
        <button class="close">x</button>
      </div>
    `;
    d3.select('body').html(metaDomStr);

    /**
     * Get metadata Dom element again when it added into <body>
     */
    const _metaDom = d3.select('#metadata');
    _metaDom.select('.close')
      .on('click', () => _metaDom.style('display', 'none'));
  }

  /**
   * Toggle node information panel
   */
  toggleNodeInfo (node) {
    const nodeInfoDom = d3.select('#nodeinfo');
    console.log(nodeInfoDom);

    /**
     * Check whether it is showed on canvas
     */
    if (document.getElementById('nodeinfo')) {
      if (nodeInfoDom.select('#node-id').text() !== node.id) {
        nodeInfoDom.select('#node-id').text(node.id);
        nodeInfoDom.style('display', 'block');
      } else {
        if (nodeInfoDom.style('display') === 'none') {
          nodeInfoDom.style('display', 'block');
        } else nodeInfoDom.style('display', 'none');
      }
      return;
    }

    const nodeInfoDomStr = `
      <div class="nodeinfo" id="nodeinfo">
        <ul class="node-info-list">
          <li class="node-info-item id"><strong>Id</strong>: <span id="node-id">${node.id}</span></li>
        </ul>
        <button class="close">x</button>
      </div>
    `;

    const _div = document.createElement('div');
    _div.innerHTML = nodeInfoDomStr;
    document.querySelector('body').appendChild(_div.children[0]);

    /**
     * Get metadata Dom element again when it added into <body>
     */
    const _nodeInfoDom = d3.select('#nodeinfo');
    _nodeInfoDom.select('.close')
      .on('click', () => _nodeInfoDom.style('display', 'none'));
  }

  /**
   * Change theme
   * @param {string} theme
   */
  switchTheme (theme) {
    const body = d3.select('body');
    body.classed('default', this.defaultStyle);
    body.classed(theme, !!theme);
  }

  /**
   * Enable zoom behavior
   */
  enableZoom () {
    const _this = this;
    const { camera, width, height } = this;
    // const { left, right, top, bottom } = camera;
    // let oldK = 1;
    // let oldX = 0;
    // let oldY = 0;
    // let xMouse = 0;
    // let yMouse = 0;
    // _this.el.addEventListener('mousedown', function (event) {
    //   console.log(event);
    //   console.log(event.pageX, event.pageY);
    //   xMouse = event.pageX;
    //   yMouse = event.pageY;
    // }, false);
    const zoom = d3.zoom()
          .scaleExtent(_this.scaleExtent)
          .on('zoom', function () {
            let { x, y, k } = d3.zoomTransform(this);
            // console.log(x, y, k);
            // console.log(camera.left, camera.right, camera.top, camera.bottom);
            // const _x = xMouse + k * (oldX - xMouse) / oldK;
            // const _y = yMouse + k * (oldY - yMouse) / oldK;
            // camera.left = left / k - _x;
            // camera.right = right / k - _x;
            // camera.top = top / k + _y;
            // camera.bottom = bottom / k + _y;
            // console.log(camera.left, camera.right, camera.top, camera.bottom);
            camera.zoom = k;
            camera.updateProjectionMatrix();
            // oldK = k;
            // oldX = x;
            // oldY = y;
          });
    d3.select(_this.el).call(zoom).on('dblclick.zoom', null);
  }

  /**
   * Render force layout
   */
  render () {
    const _this = this;
    const { width, height, data, scene, camera, renderer } = this;
    renderer.setSize(width, height);
    this.el.appendChild(renderer.domElement);
    camera.position.z = 5;
    this.controller = new EventsController({
      dom: renderer.domElement,
      scene: scene,
      camera: camera
    });

    data.nodes.forEach((node) => {
      node.geometry = new THREE.CircleBufferGeometry(5, 32);
      node.material = new THREE.MeshBasicMaterial({ color: colour(node.id) });
      node.circle = new THREE.Mesh(node.geometry, node.material);
      node.circle.on('click', (m) => {
        _this.toggleNodeInfo(node);
      });
      node.circle.on('hover', (m) => {
        m.scale.set(2, 2, 2);
      }, (m) => {
        m.scale.set(1, 1, 1);
      });
      scene.add(node.circle);
    });

    data.links.forEach((link) => {
      link.material = new THREE.LineBasicMaterial({ color: 0xAAAAAA, linewidth: 2 });
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
        line.geometry.vertices[0] = new THREE.Vector3(source.x, source.y, -1);
        line.geometry.vertices[1] = new THREE.Vector3(target.x, target.y, -1);
        // set z axis value -1 is to make line behind the node
      });

      render();
    }

    function render () {
      requestAnimationFrame(render);
      renderer.render(scene, camera);
    };
  }

  /**
   * Callback of window resize event
   */
  onWindowResize () {
    const _this = this;
    const { scene, camera, renderer } = _this;
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
    // controller.handleResize();
		render();

    function render () {
      requestAnimationFrame(render);
      renderer.render(scene, camera);
    };
  }
}

export default Netjsongraph;
