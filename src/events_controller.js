/**
 * @fileOverview Mouse events management
 * @name events_controller.js
 * @author GeekPlux
 * @license BSD 3-clause
 * @version 0.0.1
 */

import * as THREE from 'three';
import { isFn } from './utils.js';

/**
 * Get target Object list
 * @param {Object} targetList event target list
 */
function getObjList (targetList) {
  const objList = [];
  for (let t in targetList) {
    objList.push(targetList[t].object3d);
  }
  return group2meshlist(objList);

  /**
   * Group the mesh to a list
   */
  function group2meshlist (objList) {
    let list = [];
    for (let o in objList) {
      if (objList[o].type === 'Group') {
        list = list.concat(group2meshlist(objList[o].children));
      } else {
        list.push(objList[o]);
      }
    }
    return list;
  }
}

/**
 * calculate mouse position in normalized device coordinates
 * (-1 to +1) for both components
 */
function Mouse (event, ctx) {
  return new THREE.Vector2((event.clientX / ctx.width) * 2 - 1,
                           -(event.clientY / ctx.height) * 2 + 1);
}

function _intersects (targetList, event, ctx) {
  const ray = new THREE.Raycaster();
  ray.setFromCamera(Mouse(event, ctx), ctx.camera);
  const list = getObjList(targetList) || []; // Find target objects

  return ray.intersectObjects(list);
}

/**
 * Get current event object
 * @param {Object} targetList event target list
 * @param {Object} object3d
 */
function getEventObj (targetList, object3d) {
  return targetList[object3d.id]
    ? targetList[object3d.id]
    : getEventObj(targetList, object3d.parent);
}

const defaults = {
  dom: document.body,
  width: window.innerWidth,
  height: window.innerHeight,
  scene: {},
  camera: {},
  renderer: {},
  EventType: { click: {}, hover: {} }, // Event type
  onEvent: {},
  listenerList: {},
  noContextMenu: true
};

export default class EventsController {

  constructor (config) {
    this.set(config);
    this.init();
  }

  /**
   * Set properties
   * @param {Object} config
   */
  set (config) {
    Object.assign(this, defaults, config);
    return this;
  }

  init () {
    if (this.noContextMenu) this.disableContextMenu();
    this.initEventType();

    // Binding click event to target object
    this.listenerList.click = this.click();

    // Binding hover event to target object
    this.listenerList.hover = this.hover();

    // Binding event controller to Three.js object
    this.assignController();
  }

  /**
   * Travel the eventType list and add listener to listenerList
   */
  initEventType () {
    const { EventType, onEvent, listenerList } = this;
    for (let e in EventType) {
      onEvent[e] = {
        flag: false,
        listen: targetList => listenerList[e](targetList)
      };
    }
  }

  click () {
    const _this = this;
    return function (targetList) {
      let targetObject;
      let obj;
      let isClicked = false;

      function down (event) {
        if (!targetList) return;
        const intersects = _intersects(targetList, event, _this);
        if (intersects.length > 0) {
          if (isClicked) return;
          isClicked = true;
          targetObject = intersects[0].object; // The nearest target object
          obj = getEventObj(targetList, targetObject); // Find current event object
        } else {
          isClicked = false;
        }
      }

      function move (event) {
        // disable click trigger when mouse moving
        if (isClicked) isClicked = false;
      }

      function up (event) {
        if (isClicked && !!obj.callback[0]) obj.callback[0](targetObject); // Callback called
        isClicked = false;
      }

      _this.dom.addEventListener('mousedown', down, false);
      _this.dom.addEventListener('mousemove', move, false);
      _this.dom.addEventListener('mouseup', up, false);
    };
  }

  hover () {
    const _this = this;
    return function (targetList) {
      let obj;
      let targetObject;
      let isHovered = false;

      function move (event) {
        if (!targetList) return;
        const intersects = _intersects(targetList, event, _this);

        if (intersects.length > 0) {
          if (isHovered) return;
          isHovered = true;
          targetObject = intersects[0].object;
          obj = getEventObj(targetList, targetObject);
          if (obj.callback[0]) obj.callback[0](targetObject);
        } else {
          if (isHovered && !!obj.callback[1]) {
            obj.callback[1](targetObject);
          }
          isHovered = false;
        }
      }

      _this.dom.addEventListener('mousemove', move, false);
    };
  }

  zoom (callback) {
    const { camera } = this;
    this.dom.addEventListener('wheel', (event) => {
      event.preventDefault();
      camera.zoom += -event.deltaY * (event.deltaMode ? 120 : 1) / 500;
      camera.updateProjectionMatrix();
      if (isFn(callback)) callback();
    });
  }

  pan (callback) {
    const { camera } = this;
    let isPanning = false;
    let startPosition = {};
    let currentPosition = {};
    let lastCameraPosition = { x: 0, y: 0 };

    function down (event) {
      isPanning = true;
      startPosition.x = event.clientX;
      startPosition.y = event.clientY;
    }

    function move (event) {
      if (!isPanning) return;
      currentPosition = {
        x: event.clientX,
        y: event.clientY
      };
      camera.position.x = lastCameraPosition.x + startPosition.x - currentPosition.x;
      camera.position.y = lastCameraPosition.y + currentPosition.y - startPosition.y;
    }

    function up (event) {
      isPanning = false;
      lastCameraPosition.x = camera.position.x;
      lastCameraPosition.y = camera.position.y;
      if (isFn(callback)) callback();
    }

    this.dom.addEventListener('mousedown', down, false);
    this.dom.addEventListener('mousemove', move, false);
    this.dom.addEventListener('mouseup', up, false);
  }

  assignController () {
    const { EventType, onEvent } = this;
    Object.assign(THREE.Object3D.prototype, {
      on: function (method, callback1, callback2) {
        if (onEvent.hasOwnProperty(method)) {
          EventType[method][this.id] = {
            object3d: this,
            callback: Array.from(arguments).slice(1)
          };
          const eventlistener = onEvent[method];
          if (!eventlistener.flag) {
            eventlistener.flag = true;
            eventlistener.listen(EventType[method]);
          }
        } else {
          console.warn("There is no method called '" + method + "';");
        }
      },
      off: function (method) {
        if (method) {
          if (onEvent.hasOwnProperty(method)) {
            delete EventType[method][this.id];
          } else {
            console.warn("There is no method called '" + method + "';");
          }
        } else {
          for (let e in EventType) {
            delete EventType[e][this.id];
          }
        }
      }
    });
  }

  /**
   * Disable right click event
   */
  disableContextMenu () {
    this.dom.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  }

  /**
   * Remove all event listeners
   */
  removeAll () {
    const { EventType } = this;
    for (let key in EventType) {
      for (let id in EventType[key]) {
        delete EventType[key][id];
      }
    }
  }
}
