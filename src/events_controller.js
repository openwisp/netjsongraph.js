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
  TargetList: { click: {}, hover: {} },
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

    Object.keys(TargetList).forEach((v, i) => {
      EventListeners[v] = {
        flag: false,
        listener: function (targetList) {
          listenerList[v](targetList, camera);
        }
      };
    });

    function getObjList (targetList) {
      var list = [];
      for (var key in targetList) {
        var target = targetList[key].object3d;
        list.push(target);
      }
      return group2meshlist(list);
    }

    function group2meshlist (list) {
      var l = [];
      for (var i in list) {
        if (list[i].type === 'Group') {
          l = l.concat(group2meshlist(list[i].children));
        } else {
          l.push(list[i]);
        }
      }
      return l;
    }

    function getEventObj (targetList, object3d) {
      return object2group(targetList, object3d);
    }

    function object2group (targetList, object3d) {
      if (targetList[object3d.id]) {
        return targetList[object3d.id];
      } else {
        return object2group(targetList, object3d.parent);
      }
    }

    listenerList.click = function (targetList, camera) {
      let targetObject;
      let obj;
      let Click = false;
      const Mouse = new THREE.Raycaster();
      function down (event) {
        event.preventDefault();
        if (!targetList) return;
        let list = [];
        Mouse.setFromCamera(new THREE.Vector2((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1), camera);
        list = getObjList(targetList);
        const intersects = Mouse.intersectObjects(list);

        if (intersects.length > 0) {
          if (Click) return;
          Click = true;
          targetObject = intersects[0].object;
          obj = getEventObj(targetList, targetObject);
        } else {
          Click = false;
        }
      }
      function move (event) {
        event.preventDefault();
        // disable click trigger when mouse moving
        if (Click) Click = false;
      }
      function up (event) {
        event.preventDefault();
        if (Click && !!obj.callback[0]) obj.callback[0](targetObject);
        Click = false;
      }
      window.addEventListener('mousedown', down, false);
      window.addEventListener('mousemove', move, false);
      window.addEventListener('mouseup', up, false);
    };

    listenerList.hover = function (targetList, camera) {
      let targetObject;
      let obj;
      let Hover = false;
      const Mouse = new THREE.Raycaster();
      window.addEventListener('mousemove', function (event) {
        event.preventDefault();
        if (!targetList) return;
        let list = [];
        Mouse.setFromCamera(new THREE.Vector2((event.clientX / window.innerWidth) * 2 - 1, -(event.clientY / window.innerHeight) * 2 + 1), camera);

        list = getObjList(targetList);
        const intersects = Mouse.intersectObjects(list);

        if (intersects.length > 0) {
          if (Hover) return;
          Hover = true;
          targetObject = intersects[0].object;
          obj = getEventObj(targetList, targetObject);
          if (obj.callback[0]) obj.callback[0](targetObject);
        } else {
          if (Hover && !!obj.callback[1]) {
            obj.callback[1](targetObject);
          }
          Hover = false;
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
          for (var key in TargetList) {
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
