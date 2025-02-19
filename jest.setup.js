HTMLCanvasElement.prototype.getContext = function (type) {
  if (type === "2d") {
    return {
      fillRect() {},
      clearRect() {},
      getImageData() {
        return {data: []};
      },
      putImageData() {},
      createImageData() {
        return [];
      },
      setTransform() {},
      drawImage() {},
      save() {},
      fillText() {},
      restore() {},
      beginPath() {},
      moveTo() {},
      lineTo() {},
      closePath() {},
      stroke() {},
      translate() {},
      scale() {},
      rotate() {},
      arc() {},
      fill() {},
      measureText() {
        return {width: 0};
      },
      transform() {},
      rect() {},
      clip() {},
      dpr: 1, // Dummy device pixel ratio for zrender/ECharts
      lineWidth: 0, // Optional dummy property
      strokeStyle: "", // Optional dummy property
    };
  }
  return null;
};
