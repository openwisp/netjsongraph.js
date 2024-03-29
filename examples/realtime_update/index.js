const express = require("express");
const http = require("http");
const path = require("path");
const {Server} = require("socket.io");
const open = require("open");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, GET, OPTIONS, PUT, PATCH, DELETE",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use(express.static(path.join(__dirname, "assets")));

let JSONData = {
  type: "NetworkGraph",
  label: "Ninux Roma",
  protocol: "OLSR",
  version: "0.6.6.2",
  metric: "ETX",
  date: "2019-04-03T05:06:54.000Z",
  nodes: [
    {
      id: "172.16.146.6",
      category: "category1",
      name: "l8dt6nqh",
      location: {lng: "54.905", lat: "265.999"},
    },
    {
      id: "10.177.0.10",
      category: "category3",
      name: "l133is73",
      location: {lng: "54.780", lat: "276.729"},
    },
    {
      id: "172.16.139.4",
      category: "category4",
      name: "yyjd696o",
      location: {lng: "47.217", lat: "278.539"},
    },
    {
      id: "172.16.135.15",
      category: "category4",
      name: "2f6hxcfe",
      location: {lng: "57.608", lat: "263.862"},
    },
    {
      id: "192.168.145.145",
      category: "category4",
      name: "knga632p",
      location: {lng: "50.582", lat: "269.162"},
    },
    {
      id: "172.16.186.249",
      category: "category0",
      name: "mesgopn5",
      location: {lng: "42.553", lat: "253.351"},
    },
    {
      id: "172.16.12.10",
      category: "category4",
      name: "sj6l3pbj",
      location: {lng: "58.119", lat: "275.192"},
    },
    {
      id: "172.16.177.31",
      category: "category0",
      name: "3a5dfwvo",
      location: {lng: "42.223", lat: "261.975"},
    },
    {
      id: "10.183.1.11",
      category: "category4",
      name: "ww65tgqj",
      location: {lng: "56.959", lat: "257.375"},
    },
    {
      id: "172.16.200.67",
      category: "category0",
      name: "13mbktrw",
      location: {lng: "54.588", lat: "273.927"},
    },
    {
      id: "192.168.23.3",
      category: "category1",
      name: "dmjjzmzt",
      location: {lng: "48.813", lat: "272.436"},
    },
    {
      id: "172.16.185.11",
      category: "category2",
      name: "fo3t1uii",
      location: {lng: "48.611", lat: "275.519"},
    },
    {
      id: "172.16.159.187",
      category: "category3",
      name: "pqhht9a8",
      location: {lng: "56.037", lat: "282.119"},
    },
    {
      id: "172.16.132.132",
      category: "category4",
      name: "qjw3dpr1",
      location: {lng: "51.122", lat: "268.516"},
    },
    {
      id: "10.254.254.4",
      category: "category2",
      name: "e9ail6v2",
      location: {lng: "44.770", lat: "274.280"},
    },
    {
      id: "10.123.10.10",
      category: "category0",
      name: "0h231xnp",
      location: {lng: "45.593", lat: "279.721"},
    },
  ],
  links: [
    {source: "172.16.146.6", target: "172.16.145.2", cost: 1.2939453125},
    {source: "172.16.146.6", target: "172.16.146.4", cost: 1},
    {source: "172.16.146.6", target: "172.16.146.1", cost: 1},
    {source: "172.16.146.6", target: "172.16.146.5", cost: 1},
    {source: "10.177.0.10", target: "172.16.177.17", cost: 1},
    {source: "10.177.0.10", target: "172.16.177.22", cost: 1},
    {source: "172.16.139.4", target: "172.16.138.1", cost: 1.02734375},
    {source: "172.16.139.4", target: "172.16.139.8", cost: 1},
    {source: "172.16.139.4", target: "172.16.139.9", cost: 1},
    {source: "172.16.139.4", target: "172.16.139.3", cost: 17.111328125},
    {source: "172.16.135.15", target: "10.135.11.253", cost: 1},
    {source: "172.16.135.15", target: "172.16.135.10", cost: 1.9609375},
    {source: "172.16.135.15", target: "10.123.10.10", cost: 1},
    {source: "192.168.145.145", target: "10.254.254.2", cost: 1},
    {source: "172.16.186.249", target: "172.16.159.187", cost: 1},
    {source: "172.16.186.249", target: "172.16.159.50", cost: 1},
    {source: "172.16.186.249", target: "172.16.155.20", cost: 1.28125},
    {source: "172.16.171.1", target: "172.16.169.1", cost: 1.1181640625},
    {source: "172.16.171.1", target: "172.16.177.17", cost: 1},
    {source: "172.16.159.65", target: "172.16.159.25", cost: 1.11328125},
    {source: "172.16.155.5", target: "172.16.155.6", cost: 1},
    {source: "172.16.155.5", target: "172.16.44.1", cost: 1.3779296875},
    {source: "172.16.155.5", target: "172.16.133.1", cost: 1.080078125},
    {source: "172.16.155.5", target: "172.16.155.4", cost: 1},
    {source: "172.16.155.5", target: "172.16.44.10", cost: 1.1328125},
    {source: "10.45.0.1", target: "10.45.0.2", cost: 1},
    {source: "172.16.151.1", target: "172.16.151.32", cost: 1},
    {source: "172.16.151.1", target: "172.16.151.2", cost: 1},
    {source: "10.139.13.1", target: "172.16.139.254", cost: 1},
    {source: "172.16.139.10", target: "172.16.141.2", cost: 1},
    {source: "172.16.155.4", target: "172.16.155.6", cost: 1},
    {source: "172.16.171.15", target: "172.16.159.25", cost: 1},
    {source: "172.16.141.3", target: "172.16.141.2", cost: 1.1181640625},
    {source: "192.168.176.10", target: "172.16.177.30", cost: 1},
    {source: "192.168.176.10", target: "172.16.40.23", cost: 1.6171875},
    {source: "192.168.176.10", target: "172.16.159.25", cost: 1},
    {source: "192.168.176.10", target: "10.254.254.3", cost: 2.02734375},
    {source: "172.16.49.20", target: "172.16.40.62", cost: 1},
    {source: "172.16.44.10", target: "172.16.44.11", cost: 1},
    {source: "10.185.1.1", target: "10.185.1.10", cost: 1},
    {source: "10.168.177.1", target: "172.16.159.25", cost: 1},
    {source: "172.16.146.1", target: "172.16.146.5", cost: 1},
    {source: "172.16.146.1", target: "192.168.145.1", cost: 1.1748046875},
    {source: "172.16.146.1", target: "10.185.1.10", cost: 1.25},
    {source: "172.16.132.7", target: "172.16.132.6", cost: 1},
    {source: "172.16.132.7", target: "172.16.132.14", cost: 1},
  ],
};

io.on("connection", function (socket) {
  console.log("client connected");

  socket.on("disconnect", function () {
    console.log("client disconnected");
  });
  setTimeout(() => {
    socket.emit("netjsonChange", JSONData);
  }, 5000);
});

app.use("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

server.listen(3000, () => {
  console.log("listening on PORT 3000");
  open("http://localhost:3000");
});
