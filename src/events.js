/**
 * @fileOverview Camera events binding
 * @name events.js
 * @author GeekPlux
 * @license BSD 3-clause
 * @version 0.0.1
 */

const STATE = {
  NONE: -1,
  ROTATE: 0,
  ZOOM: 1,
  PAN: 2,
  TOUCH_ROTATE: 3,
  TOUCH_ZOOM_PAN: 4
};

const defaults = {
  dom: document,
  screen: { left: 0, top: 0, width: 0, height: 0 }
};

export default class Events {

  constructor (config) {
    this.set(config);
  }

  /**
   * Set properties
   * @param {Object} config
   */
  set (config) {
    Object.assign(this, defaults, config);
    return this;
  }

  handleResize () {
    if (this.dom === document) {
      this.screen.left = 0;
      this.screen.top = 0;
      this.screen.width = window.innerWidth;
      this.screen.height = window.innerHeight;
    } else {
      const box = this.domElement.getBoundingClientRect();
      // adjustments come from similar code in the jquery offset() function
      const d = this.domElement.ownerDocument.documentElement;
      this.screen.left = box.left + window.pageXOffset - d.clientLeft;
      this.screen.top = box.top + window.pageYOffset - d.clientTop;
      this.screen.width = box.width;
      this.screen.height = box.height;
    }
  };
}
