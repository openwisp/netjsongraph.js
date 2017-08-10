addEventListener('message', (e) => {
  console.log(e.data);
  postMessage('Work done!');
}, false);
