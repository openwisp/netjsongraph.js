import * as THREE from 'three';
import { scaleOrdinal, schemeCategory20 } from 'd3';

/**
 * Color scale generator
 * @returns {function} color generator
 */
export const colour = (() => {
  const scale = scaleOrdinal(schemeCategory20);
  return (num) => parseInt(scale(num).slice(1), 16);
})();

/**
 * Make functions return promise
 * @param {object} caller function caller
 * @param {function} fn function wanna improve
 * @returns {function} function which return promise
 */
export const promisify = (caller, fn) => (...args) =>
  new Promise((resolve, reject) => {
    const callback = (error, data) => {
      if (!error) resolve(data);
      reject(Error(error));
      return;
    };
    fn.apply(caller, args.concat(callback));
  });

/**
 * Check it whether is a function
 * @param {object}
 * @returns {boolean}
 */
export const isFn = obj => typeof obj === 'function' || false;

/**
 * Return a function
 * @param {string} f
 * @returns {functin}
 */
export const returnFn = f => isFn(f) ? f : () => f;

/**
 * Travel a Object and make its every properties return a function
 * @param {object} obj
 * @returns {object}
 */
export const travelFn = obj => {
  const newObj = {};
  for (let k in obj) {
    newObj[k] = returnFn(obj[k]);
  }
  return newObj;
};

const getPoints = (start, end, size) => {
  const vec3 = start.clone();
  const res = [];
  for (let i = 0; i < size; i++) {
    vec3.set(start.x, start.y, start.z);
    vec3.lerp(end, i / size);
    res.push(vec3.x, vec3.y, vec3.z);
  }
  return res;
};

export const getPositions = (points, count, alpha) => {
  let positions = [];
  if (!points) return positions;

  let l = count;
  const vec3s = new THREE.Vector3();
  const vec3e = vec3s.clone();
  const vec3n = vec3s.clone();

  while (l--) {
    vec3s.set(points.getX(l), points.getY(l), points.getZ(l));
    vec3n.set(vec3s.x, vec3s.y, vec3s.z);
    if (l < 1) {
      positions.push(vec3n.x, vec3n.y, vec3n.z);
      break;
    }
    vec3e.set(points.getX(l - 1), points.getY(l - 1), points.getZ(l - 1));
    const items = getPoints(vec3s, vec3e);
    positions.push.apply(positions, items);
  }

  return positions;
};
