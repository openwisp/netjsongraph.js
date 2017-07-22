// import * as THREE from 'three';
import Netjsongraph from '../src/netjsongraph.three.js';
import netjsonData from '../examples/data/netjson.json';
// import EventsController from '../src/events_controller.js';

test('Module importing', () => {
  expect(Netjsongraph).toBeDefined();
  expect(new Netjsongraph()).toBeInstanceOf(Netjsongraph);
});

describe('API', () => {
  test('API exists', () => {
    const ng = new Netjsongraph();

    expect(ng.set).toBeInstanceOf(Function);
    expect(ng.container).toBeInstanceOf(Function);
    expect(ng.load).toBeInstanceOf(Function);
    expect(ng.init).toBeInstanceOf(Function);
    expect(ng.fetch).toBeInstanceOf(Function);
    expect(ng.toggleMetadata).toBeInstanceOf(Function);
    expect(ng.toggleInfoPanel).toBeInstanceOf(Function);
    expect(ng.switchTheme).toBeInstanceOf(Function);
    expect(ng.createElements).toBeInstanceOf(Function);
    expect(ng.calculateElementsPosition).toBeInstanceOf(Function);
    expect(ng.render).toBeInstanceOf(Function);
    expect(ng.onWindowResize).toBeInstanceOf(Function);
  });

  test('constructor', () => {
    const testUrl = 'testUrl';
    const ng = new Netjsongraph(testUrl);

    expect(ng).toHaveProperty('width', window.innerWidth);
    expect(ng).toHaveProperty('height', window.innerHeight);
    expect(ng).toHaveProperty('url', testUrl);
    expect(ng).toHaveProperty('el', document.body);
    expect(ng).toHaveProperty('data', {});
    expect(ng).toHaveProperty('metadata', true);
    expect(ng).toHaveProperty('defaultStyle', true);
    expect(ng).toHaveProperty('linkDistance', 50);
    expect(ng).toHaveProperty('linkStrength', 0.2);
    expect(ng).toHaveProperty('theta', 0.8);
    expect(ng).toHaveProperty('distanceMax', 100);
    expect(ng).toHaveProperty('circleRadius', 8);
    expect(ng).toHaveProperty('onInit', null);
    expect(ng).toHaveProperty('onLoad', null);
    expect(ng).toHaveProperty('onEnd', null);
    expect(ng).toHaveProperty('onClickNode', null);
    expect(ng).toHaveProperty('onClickLink', null);
    expect(ng).toHaveProperty('initialAnimation', false);
    expect(ng).toHaveProperty('static', true);
    expect(ng).toHaveProperty('scene');
    expect(ng).toHaveProperty('camera');
  });

  test('set', () => {
    const ng = new Netjsongraph();

    ng.set({ width: 1000 });
    expect(ng).toHaveProperty('width', 1000);

    ng.set({ height: 500 });
    expect(ng).toHaveProperty('height', 500);
  });

  test('set container element', () => {
    const ng = new Netjsongraph();
    const _div = document.createElement('div');
    _div.id = 'testDiv';
    document.body.appendChild(_div);

    ng.container(_div);
    const div = document.getElementById('testDiv');
    expect(ng).toHaveProperty('el', div);
  });

  test('load data', () => {
    const ng = new Netjsongraph();
    ng.load(netjsonData);
    expect(ng).toHaveProperty('data', netjsonData);
    expect(ng.data).toHaveProperty('type', netjsonData.type);
    expect(ng.data).toHaveProperty('label', netjsonData.label);
    expect(ng.data).toHaveProperty('protocol', netjsonData.protocol);
    expect(ng.data).toHaveProperty('version', netjsonData.version);
    expect(ng.data).toHaveProperty('metric', netjsonData.metric);
    expect(ng.data.nodes).toHaveLength(netjsonData.nodes.length);
    expect(ng.data.links).toHaveLength(netjsonData.links.length);
  });

  test('fetch data', () => {
    const ng = new Netjsongraph();

    expect(ng.fetch()).rejects.toBeDefined();
  });

  test('elements creation', () => {
    // const ng = new Netjsongraph();
    // ng.load(netjsonData);
    // ng.controller = new EventsController({
    //   scene: THREE.Scene(),
    //   camera: THREE.OrthographicCamera()
    // });
    // ng.createElements();
  });
});
