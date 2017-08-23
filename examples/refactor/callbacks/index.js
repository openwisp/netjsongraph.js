const ng = new Netjsongraph('../../data/netjson.json', {
  static: false,
  initialAnimation: true,
  onInit: () => console.log('initialized'),
  onLoad: () => console.log('data loaded'),
  onEnd: () => console.log('animation completed')
});
console.log(ng);
