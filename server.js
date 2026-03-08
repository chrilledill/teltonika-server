const net = require("net");
const express = require("express");

const app = express();

const HTTP_PORT = process.env.PORT || 10000;
const TCP_PORT = 10001;

let devices = {};

function parseIO66(buffer, imei) {

  for (let i = 0; i < buffer.length - 1; i++) {

    if (buffer[i] === 66) {

      const value = buffer[i + 1];

      if (value === 1) {
        devices[imei].status = "Failed Test";
        console.log("FAILED TEST triggered from IO 66");
      }

      if (value === 0) {
        devices[imei].status = "OK";
      }

    }

  }

}

const tcpServer = net.createServer((socket) => {

  console.log("Device connected:", socket.remoteAddress);

  let currentIMEI = null;

  socket.on("data", (data) => {

    const hex = data.toString("hex");
    console.log("HEX:", hex);

    if (!currentIMEI) {

      try {

        const imeiLength = data[1];
        const imei = data.slice(2, 2 + imeiLength).toString();

        if (/^[0-9]+$/.test(imei)) {

          currentIMEI = imei;

          if (!devices[imei]) {

            devices[imei] = {
              name: "Testfordon",
              imei: imei,
              status: "OK",
              lastSeen: null
            };

          }

          console.log("IMEI received:", imei);

          socket.write(Buffer.from([0x01]));
          return;

        }

      } catch (err) {
        console.log("IMEI parse error");
      }

    }

    if (currentIMEI && devices[currentIMEI]) {

      devices[currentIMEI].lastSeen = new Date().toISOString();
      parseIO66(data, currentIMEI);

    }

    socket.write(Buffer.from([0x00,0x00,0x00,0x01]));

  });

});

tcpServer.listen(TCP_PORT, () => {
  console.log("Teltonika TCP server running on port", TCP_PORT);
});

app.get("/status", (req, res) => {
  res.json(devices);
});

app.listen(HTTP_PORT, () => {
  console.log("HTTP server running on port", HTTP_PORT);
});
