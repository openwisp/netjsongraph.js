import { scaleOrdinal, schemeCategory20 } from 'd3';

export const colour = (function () {
  const scale = scaleOrdinal(schemeCategory20);
  return (num) => parseInt(scale(num).slice(1), 16);
})();

export const promisify = (caller, fn) => (...args) =>
  new Promise((resolve, reject) => {
    const callback = (error, data) => {
      if (!error) resolve(data);
      reject(Error(error));
      return;
    };
    fn.apply(caller, args.concat(callback));
  });
