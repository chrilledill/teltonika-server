const net = require("net");

const PORT = process.env.PORT || 10000;

function parseIMEI(buffer) {
  try {
    const imei = buffer.slice(2).toString();
    return imei;
  } catch {
    return null;
  }
}

const server = net.createServer((socket) => {

  console.log("Device connected:", socket.remoteAddress);

  socket.on("data", (data) => {

    console.log("HEX:", data.toString("hex"));
    console.log("Length:", data.length);

    // Teltonika IMEI packet
    if (data.length === 17) {
      const imei = parseIMEI(data);
      console.log("IMEI:", imei);

      // Accept device
      socket.write(Buffer.from([0x01]));
      console.log("IMEI accepted");
      return;
    }

    // AVL data (very basic detection)
    if (data.length > 20) {
      console.log("AVL packet received");

      const codec = data[8];
      const records = data[9];

      console.log("Codec:", codec);
      console.log("Records:", records);
    }

  });

  socket.on("end", () => {
    console.log("Device disconnected");
  });

});

server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
