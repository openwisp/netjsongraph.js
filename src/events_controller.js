/**
 * @fileOverview Camera events binding
 * @name events_controller.js
 * @author GeekPlux
 * @license BSD 3-clause
 * @version 0.0.1
 */

import * as THREE from 'three';

const defaults = {
  noContextMenu: true,
  screen: { left: 0, top: 0, width: 0, height: 0 },
  dom: document,
  scene: {},
  camera: {},
  TargetList: { click: {}, hover: {} }, // Event type
  updateCallbackList: [],
  EventListeners: {},
  listenerList: {}
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
    const { TargetList, EventListeners, listenerList, camera } = this;

    /**
     * Travel the TargetList and add listener to listenerList
     */
    for (let t in TargetList) {
      EventListeners[t] = {
        flag: false,
        listener: function (targetList) {
          listenerList[t](targetList, camera);
        }
      };
    }

    // Get target Object list
    function getObjList (targetList) {
      const objList = [];
      for (let t in targetList) {
        objList.push(targetList[t].object3d);
      }
      return group2meshlist(objList);
    }

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

    function getEventObj (targetList, object3d) {
      return object2group(targetList, object3d);
    }

    function object2group (targetList, object3d) {
      return targetList[object3d.id] ? targetList[object3d.id]
        : object2group(targetList, object3d.parent);
    }

    function Mouse (event) {
      return new THREE.Vector2((event.clientX / window.innerWidth) * 2 - 1,
                           -(event.clientY / window.innerHeight) * 2 + 1);
    }

    listenerList.click = function (targetList, camera) {
      let targetObject;
      let obj;
      let isClicked = false;
      const ray = new THREE.Raycaster();
      function down (event) {
        if (!targetList) return;
        let list = [];
        ray.setFromCamera(Mouse(event), camera);
        list = getObjList(targetList);
        const intersects = ray.intersectObjects(list);

        if (intersects.length > 0) {
          if (isClicked) return;
          isClicked = true;
          targetObject = intersects[0].object;
          obj = getEventObj(targetList, targetObject);
        } else {
          isClicked = false;
        }
      }
      function move (event) {
        // disable click trigger when mouse moving
        if (isClicked) isClicked = false;
      }
      function up (event) {
        if (isClicked && !!obj.callback[0]) obj.callback[0](targetObject);
        isClicked = false;
      }
      window.addEventListener('mousedown', down, false);
      window.addEventListener('mousemove', move, false);
      window.addEventListener('mouseup', up, false);
    };

    listenerList.hover = function (targetList, camera) {
      let targetObject;
      let obj;
      let isHovered = false;
      const ray = new THREE.Raycaster();
      window.addEventListener('mousemove', function (event) {
        if (!targetList) return;
        let list = [];
        ray.setFromCamera(Mouse(event), camera);

        list = getObjList(targetList);
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
      }, false);
    };

    Object.assign(THREE.Object3D.prototype, {
      on: function (method, callback1, callback2) {
        if (EventListeners.hasOwnProperty(method)) {
          TargetList[method][this.id] = {
            object3d: this,
            callback: Array.from(arguments).slice(1)
          };
          const eventlistener = EventListeners[method];
          if (!eventlistener.flag) {
            eventlistener.flag = true;
            eventlistener.listener(TargetList[method]);
          }
        } else {
          console.warn("There is no method called '" + method + "';");
        }
      },
      off: function (method) {
        if (method) {
          if (EventListeners.hasOwnProperty(method)) {
            delete TargetList[method][this.id];
          } else {
            console.warn("There is no method called '" + method + "';");
          }
        } else {
          for (let key in TargetList) {
            delete TargetList[key][this.id];
          }
        }
      }
    });
  }

  disableContextMenu () {
    this.dom.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
  }

  removeAll () {
    const { TargetList } = this;
    for (let key in TargetList) {
      for (let id in TargetList[key]) {
        delete TargetList[key][id];
      }
    }
  }

  update () {
    const { updateCallbackList } = this;
    for (let key in updateCallbackList) {
      updateCallbackList[key]();
    }
  }
}
