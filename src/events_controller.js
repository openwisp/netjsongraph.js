/**
 * @fileOverview Camera events binding
 * @name events.js
 * @author GeekPlux
 * @license BSD 3-clause
 * @version 0.0.1
 */

import * as THREE from 'three';

const STATE = {
  NONE: -1,
  ROTATE: 0,
  ZOOM: 1,
  PAN: 2,
  TOUCH_ROTATE: 3,
  TOUCH_ZOOM_PAN: 4
};

const getMouseOnScreen = (function () {
  var vector = new THREE.Vector2();
  return function getMouseOnScreen (ctx, pageX, pageY) {
    vector.set(
      (pageX - ctx.screen.left) / ctx.screen.width,
      (pageY - ctx.screen.top) / ctx.screen.height
    );
    return vector;
  };
}());

const getMouseOnCircle = (function () {
  var vector = new THREE.Vector2();
  return function getMouseOnCircle (ctx, pageX, pageY) {
    vector.set(
      ((pageX - ctx.screen.width * 0.5 - ctx.screen.left) / (ctx.screen.width * 0.5)),
      ((ctx.screen.height + 2 * (ctx.screen.top - pageY)) / ctx.screen.width) // screen.width intentional
    );
    return vector;
  };
}());

const defaults = {
  dom: document,
  state: STATE.NONE,
  screen: { left: 0, top: 0, width: 0, height: 0 }
};

export default class EventsController {

  constructor (config) {
    this.set(config);
  }

  /**
   * Set properties
   * @param {Object} config
   */
  set (config) {
    Object.assign(this, defaults, config);
    this.init();
    return this;
  }

  init () {
    this.bindMouseDown();
  }

  bindMouseDown () {
    const _this = this;
    function mousedown (event) {
      const { state } = _this;
      event.preventDefault();
      event.stopPropagation();

      if (state === STATE.NONE) {
        _this.state = event.button;
      }

      if (state === STATE.ROTATE) {
        console.log(getMouseOnCircle(_this, event.pageX, event.pageY));
      } else if (state === STATE.ZOOM) {
        console.log(getMouseOnScreen(_this, event.pageX, event.pageY));
      } else if (state === STATE.PAN) {
        console.log(getMouseOnScreen(_this, event.pageX, event.pageY));
      }
    }
    this.dom.addEventListener('mousedown', mousedown, false);
  }

  handleResize () {
    if (this.dom === document) {
      this.screen.left = 0;
      this.screen.top = 0;
      this.screen.width = window.innerWidth;
      this.screen.height = window.innerHeight;
    } else {
      const box = this.dom.getBoundingClientRect();
      // adjustments come from similar code in the jquery offset() function
      const d = this.dom.ownerDocument.documentElement;
      this.screen.left = box.left + window.pageXOffset - d.clientLeft;
      this.screen.top = box.top + window.pageYOffset - d.clientTop;
      this.screen.width = box.width;
      this.screen.height = box.height;
    }
  };
}
