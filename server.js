const net = require("net");

const PORT = process.env.PORT || 5000;

const server = net.createServer((socket) => {

  console.log("Device connected");

  socket.on("data", (data) => {

    console.log("HEX:", data.toString("hex"));

    // Teltonika IMEI acknowledgement
    if (data.length === 17) {
      socket.write(Buffer.from([0x01]));
      console.log("IMEI accepted");
    }

  });

});

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
