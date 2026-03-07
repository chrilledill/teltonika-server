const net = require("net");
const http = require("http");

const HTTP_PORT = process.env.PORT || 10000;
const TCP_PORT = 10001;

/* ---------- DEVICE STORAGE ---------- */

let device = {
  name: "Testfordon",
  imei: null,
  lastSeen: null
};

/* ---------- HTTP API ---------- */

const httpServer = http.createServer((req, res) => {

  if (req.url === "/status") {

    res.writeHead(200, { "Content-Type": "application/json" });

    res.end(JSON.stringify(device, null, 2));

    return;
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Teltonika server running");

});

httpServer.listen(HTTP_PORT, () => {
  console.log("HTTP server running on port", HTTP_PORT);
});

/* ---------- TELTONIKA TCP SERVER ---------- */

const tcpServer = net.createServer((socket) => {

  console.log("Device connected:", socket.remoteAddress);

  socket.on("data", (data) => {

    console.log("HEX:", data.toString("hex"));

    /* IMEI handshake */
    if (data.length === 17) {

      const imei = data.slice(2).toString();

      console.log("IMEI received:", imei);

      device.imei = imei;
      device.lastSeen = new Date().toISOString();

      socket.write(Buffer.from([0x01]));
      console.log("IMEI accepted");

      return;
    }

    /* AVL packet received */
    if (data.length > 20) {

      device.lastSeen = new Date().toISOString();

      console.log("AVL data received");

    }

  });

});

tcpServer.listen(TCP_PORT, () => {
  console.log("Teltonika TCP server running on port", TCP_PORT);
});
