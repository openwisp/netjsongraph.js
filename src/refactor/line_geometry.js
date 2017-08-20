import * as THREE from 'three';

function setLinePosition (source, target) {
  const line = this;
  const w = line.lineWidth;

  // calculate the angle
  const t = Math.atan2(Math.abs(source.y - target.y), Math.abs(source.x - target.x));

  // calculate coordinate
  let left;
  let right;
  let down = false; // rate
  if (source.x >= target.x && source.y >= target.y) {
    left = target;
    right = source;
    down = true;
  } else if (source.x <= target.x && source.y <= target.y) {
    left = source;
    right = target;
    down = true;
  } else if (source.x > target.x && source.y < target.y) {
    left = target;
    right = source;
  } else if (source.x < target.x && source.y > target.y) {
    left = source;
    right = target;
  } else {
    left = source;
    right = target;
  }

  if (down) {
    line.vertices[0].set(left.x + w * Math.sin(t), left.y - w * Math.cos(t), 1);
    line.vertices[1].set(right.x + w * Math.sin(t), right.y - w * Math.cos(t), 1);
    line.vertices[2].set(right.x - w * Math.sin(t), right.y + w * Math.cos(t), 1);
    line.vertices[3].set(left.x - w * Math.sin(t), left.y + w * Math.cos(t), 1);
  } else {
    line.vertices[0].set(left.x - w * Math.sin(t), left.y - w * Math.cos(t), 1);
    line.vertices[1].set(right.x - w * Math.sin(t), right.y - w * Math.cos(t), 1);
    line.vertices[2].set(right.x + w * Math.sin(t), right.y + w * Math.cos(t), 1);
    line.vertices[3].set(left.x + w * Math.sin(t), left.y + w * Math.cos(t), 1);
  }
}

function lineGeometry (lineWidth) {
  const geometry = new THREE.Geometry();
  const VERTICES_COUNT = 4;

  for (let i = 0; i < VERTICES_COUNT; ++i) {
    // set z axis value -1 is to make line behind the node
    geometry.vertices.push(new THREE.Vector3(0, 0, 1));
  }

  geometry.faces.push(new THREE.Face3(0, 1, 2));
  geometry.faces.push(new THREE.Face3(0, 2, 3));
  geometry.computeBoundingSphere();
  geometry.lineWidth = lineWidth;
  geometry.setPosition = setLinePosition;
  return geometry;
}

export default lineGeometry;
