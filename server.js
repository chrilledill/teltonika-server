const net = require("net");

const PORT = process.env.PORT || 10000;

const server = net.createServer((socket) => {

  console.log("Device connected from:", socket.remoteAddress);

  socket.on("data", (data) => {

    console.log("Data length:", data.length);
    console.log("HEX:", data.toString("hex"));

    // IMEI handshake
    if (data.length === 17) {
      console.log("IMEI received");
      socket.write(Buffer.from([0x01]));
    }

  });

  socket.on("end", () => {
    console.log("Device disconnected");
  });

});

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
