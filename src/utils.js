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
