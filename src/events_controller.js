/**
 * @fileOverview Mouse events management
 * @name events_controller.js
 * @author GeekPlux
 * @license BSD 3-clause
 * @version 0.0.1
 */

import * as THREE from 'three';

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

    /**
     * Binding click event to target object
     */
    this.listenerList.click = this.click();

    /**
     * Binding hover event to target object
     */
    this.listenerList.hover = this.hover();

    /**
     * Binding event controller to Three.js object
     */
    this.assignController();

    this.zoom();
    this.pan();
  }

  /**
   * Travel the eventType list and add listener to listenerList
   */
  initEventType () {
    const { EventType, onEvent, listenerList, camera } = this;
    for (let e in EventType) {
      onEvent[e] = {
        flag: false,
        listen: targetList => listenerList[e](targetList, camera)
      };
    }
  }

  click () {
    const _this = this;
    const { camera, dom } = this;
    return function (targetList) {
      let targetObject;
      let obj;
      let isClicked = false;
      const ray = new THREE.Raycaster();

      function down (event) {
        if (!targetList) return;
        ray.setFromCamera(Mouse(event, _this), camera);
        const list = getObjList(targetList) || []; // Find target objects
        const intersects = ray.intersectObjects(list);

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

      dom.addEventListener('mousedown', down, false);
      dom.addEventListener('mousemove', move, false);
      dom.addEventListener('mouseup', up, false);
    };
  }

  hover () {
    const _this = this;
    const { camera, dom } = this;
    return function (targetList) {
      let obj;
      let targetObject;
      let isHovered = false;
      const ray = new THREE.Raycaster();

      function move (event) {
        if (!targetList) return;
        ray.setFromCamera(Mouse(event, _this), camera);
        const list = getObjList(targetList) || [];
        const intersects = ray.intersectObjects(list);

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

      dom.addEventListener('mousemove', move, false);
    };
  }

  zoom () {
    this.dom.addEventListener('mousedown', () => {
      console.log('zoom down');
    });
  }

  pan () {
    this.dom.addEventListener('mousedown', () => {
      console.log('pan down');
    });
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
