import { scaleOrdinal, schemeCategory20 } from 'd3';

export const colour = (function () {
  const scale = scaleOrdinal(schemeCategory20);
  return (num) => parseInt(scale(num).slice(1), 16);
})();
