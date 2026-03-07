const net = require("net");
const http = require("http");

const HTTP_PORT = process.env.PORT || 10000;
const TCP_PORT = 10001;

/* ---------- HTTP SERVER ---------- */

http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("Teltonika server running\n");
}).listen(HTTP_PORT, () => {
  console.log("HTTP server running");
});

/* ---------- TELTONIKA TCP SERVER ---------- */

function parseAVL(data) {
  try {

    const codec = data[8];
    const records = data[9];

    console.log("Codec:", codec);
    console.log("Record count:", records);

    if (records > 0) {

      const timestamp = data.readBigUInt64BE(10);
      const priority = data[18];

      const lon = data.readInt32BE(19) / 10000000;
      const lat = data.readInt32BE(23) / 10000000;

      console.log("Timestamp:", timestamp.toString());
      console.log("Priority:", priority);
      console.log("Latitude:", lat);
      console.log("Longitude:", lon);

    }

  } catch (err) {
    console.log("Parser error:", err.message);
  }
}

const tcpServer = net.createServer((socket) => {

  console.log("Device connected:", socket.remoteAddress);

  socket.on("data", (data) => {

    console.log("HEX:", data.toString("hex"));

    /* IMEI handshake */
    if (data.length === 17) {

      const imei = data.slice(2).toString();

      console.log("IMEI:", imei);

      socket.write(Buffer.from([0x01]));
      console.log("IMEI accepted");

      return;
    }

    /* AVL data */
    if (data.length > 20) {
      console.log("AVL packet received");
      parseAVL(data);
    }

  });

  socket.on("end", () => {
    console.log("Device disconnected");
  });

});

tcpServer.listen(TCP_PORT, () => {
  console.log("Teltonika TCP server running on port", TCP_PORT);
});
