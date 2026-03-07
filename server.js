const net = require("net");
const http = require("http");

const HTTP_PORT = process.env.PORT || 10000;
const TCP_PORT = 10001;

/* ---------- DEVICE STATUS STORAGE ---------- */

const devices = {};

/* ---------- HTTP SERVER (for browser + app) ---------- */

const httpServer = http.createServer((req, res) => {

  if (req.url === "/devices") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(devices, null, 2));
    return;
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Teltonika server running\n");

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

      devices[imei] = {
        online: true,
        lastSeen: new Date()
      };

      console.log("Device marked ONLINE:", imei);

      socket.write(Buffer.from([0x01]));
      console.log("IMEI accepted");

      return;
    }

    /* AVL packet */
    if (data.length > 20) {

      console.log("AVL data received");

      const imei = Object.keys(devices)[0];

      if (imei) {
        devices[imei].lastSeen = new Date();
      }

    }

  });

  socket.on("end", () => {
    console.log("Device disconnected");
  });

});

tcpServer.listen(TCP_PORT, () => {
  console.log("Teltonika TCP server running on port", TCP_PORT);
});
