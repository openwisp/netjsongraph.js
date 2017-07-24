import { colour } from '../utils.js';

export default {
  basic: {
    nodeColor: node => colour(node.id)
  }
};
