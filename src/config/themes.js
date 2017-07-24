import { colour } from '../utils.js';

export default {
  basic: {
    nodeColor: node => colour(node.id),
    circleRadius: 8,
    linkColor: 0xAAAAAA,
    linkWidth: 2,
    linkHoveredColor: 0x666666
  }
};
