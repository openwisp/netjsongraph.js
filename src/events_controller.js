/**
 * @fileOverview Camera events binding
 * @name events_controller.js
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
  const vector = new THREE.Vector2();
  return function getMouseOnScreen (ctx, pageX, pageY) {
    vector.set(
      (pageX - ctx.screen.left) / ctx.screen.width,
      (pageY - ctx.screen.top) / ctx.screen.height
    );
    return vector;
  };
}());

const getMouseOnCircle = (function () {
  const vector = new THREE.Vector2();
  return function getMouseOnCircle (ctx, pageX, pageY) {
    vector.set(
      ((pageX - ctx.screen.width * 0.5 - ctx.screen.left) / (ctx.screen.width * 0.5)),
      ((ctx.screen.height + 2 * (ctx.screen.top - pageY)) / ctx.screen.width) // screen.width intentional
    );
    return vector;
  };
}());

const defaults = {
  state: STATE.NONE,
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
    console.log(this);
    if (this.noContextMenu) this.disableContextMenu();
    // this.bindMouseDown();
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
