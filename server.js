const net = require("net");
const express = require("express");
const http = require("http");

const app = express();

const PORT = process.env.PORT || 10000;

const OFFLINE_TIMEOUT = 3600000; // 1 timme

let device = {
  name: "Testfordon 1",
  imei: "356307042441013",
  status: "Offline",
  lastSeen: null
};


function parseIO66(buffer) {

  for (let i = 0; i < buffer.length - 1; i++) {

    if (buffer[i] === 66) {

      const value = buffer[i + 1];

      if (value === 1) {
        device.status = "Failed Test";
        console.log("FAILED TEST triggered from IO 66");
      }

      if (value === 0) {
        device.status = "OK";
      }

    }

  }

}


// ============================
// TELTONIKA TCP HANDLER
// ============================

const tcpServer = net.createServer((socket) => {

  console.log("Device connected:", socket.remoteAddress);

  let currentIMEI = null;

  socket.on("data", (data) => {

    const hex = data.toString("hex");
    try {
  console.log("TEXT:", data.toString());
} catch {
  console.log("HEX:", data.toString("hex"));
}

    if (!currentIMEI) {

      try {

        const imeiLength = data[1];
        const imei = data.slice(2, 2 + imeiLength).toString();

        if (/^[0-9]+$/.test(imei)) {

          currentIMEI = imei;
          device.imei = imei;

          console.log("IMEI received:", imei);

          socket.write(Buffer.from([0x01]));
          return;

        }

      } catch (err) {
        console.log("IMEI parse error");
      }

    }

    device.lastSeen = new Date().toISOString();
    parseIO66(data);

    socket.write(Buffer.from([0x00,0x00,0x00,0x01]));

  });

  socket.on("close", () => {
    console.log("Device disconnected");
  });

});


// ============================
// HTTP API
// ============================

app.get("/", (req, res) => {
  res.send("Teltonika server running");
});

app.get("/status", (req, res) => {

  let status = device.status;

  if (device.lastSeen) {

    const diff = Date.now() - new Date(device.lastSeen).getTime();

    if (diff > OFFLINE_TIMEOUT && status !== "Failed Test") {
      status = "Offline";
    }

  } else {
    status = "Offline";
  }

  res.json({
    name: device.name,
    imei: device.imei,
    status: status,
    lastSeen: device.lastSeen
  });

});


// ============================
// SHARED PORT (RENDER)
// ============================

const server = http.createServer(app);

server.on("connection", (socket) => {
  tcpServer.emit("connection", socket);
});

server.listen(PORT, () => {
  console.log("HTTP + Teltonika server running on port", PORT);
});
