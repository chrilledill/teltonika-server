const net = require("net");
const http = require("http");

const PORT = process.env.PORT || 10000;

/* ---------- HTTP SERVER (for browser / health check) ---------- */

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Teltonika server running\n");
}).listen(PORT, () => {
  console.log("HTTP server running on port", PORT);
});

/* ---------- TELTONIKA TCP SERVER ---------- */

const tcpServer = net.createServer((socket) => {

  console.log("Device connected:", socket.remoteAddress);

  socket.on("data", (data) => {

    console.log("HEX:", data.toString("hex"));
    console.log("Length:", data.length);

    // Teltonika IMEI handshake
    if (data.length === 17) {
      const imei = data.slice(2).toString();
      console.log("IMEI:", imei);

      socket.write(Buffer.from([0x01]));
      console.log("IMEI accepted");
      return;
    }

    if (data.length > 20) {
      console.log("AVL packet received");
    }

  });

  socket.on("end", () => {
    console.log("Device disconnected");
  });

});

tcpServer.listen(10001, () => {
  console.log("TCP server for Teltonika running on port 10001");
});
