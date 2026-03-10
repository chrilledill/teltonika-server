const net = require("net");
const axios = require("axios");

const TCP_PORT = 5027;

const RENDER_ENDPOINT = "https://teltonika-server.onrender.com/teltonika";

const server = net.createServer((socket) => {

  console.log("Device connected:", socket.remoteAddress);

  let imei = null;

  socket.on("data", async (data) => {

    const hex = data.toString("hex");
    console.log("HEX:", hex);

    if (!imei) {

      try {

        const len = data[1];
        imei = data.slice(2, 2 + len).toString();

        console.log("IMEI:", imei);

        socket.write(Buffer.from([0x01]));

        return;

      } catch (err) {
        console.log("IMEI parse error");
      }

    }

    try {

      await axios.post(RENDER_ENDPOINT, {
        imei: imei,
        data: hex,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.log("HTTP send failed");
    }

    socket.write(Buffer.from([0x00,0x00,0x00,0x01]));

  });

  socket.on("close", () => {
    console.log("Device disconnected");
  });

});

server.listen(TCP_PORT, () => {
  console.log("Teltonika gateway listening on", TCP_PORT);
});
