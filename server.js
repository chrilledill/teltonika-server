const net = require("net");
const express = require("express");

const app = express();

const HTTP_PORT = process.env.PORT || 10000;
const TCP_PORT = 10001;

let deviceStatus = {
  name: "Testfordon",
  imei: null,
  status: "OK",
  lastSeen: null
};

function parseIO66(buffer) {

  for (let i = 0; i < buffer.length - 1; i++) {

    if (buffer[i] === 66) {

      const value = buffer[i + 1];

      if (value === 1) {
        deviceStatus.status = "Failed Test";
        console.log("FAILED TEST triggered from IO 66");
      }

      if (value === 0) {
        deviceStatus.status = "OK";
      }

    }

  }

}

const tcpServer = net.createServer((socket) => {

  console.log("Device connected:", socket.remoteAddress);

  socket.on("data", (data) => {

    console.log("HEX:", data.toString("hex"));

    deviceStatus.lastSeen = new Date().toISOString();

    if (!deviceStatus.imei) {

      try {

        const imeiLength = data[1];
        const imei = data.slice(2, 2 + imeiLength).toString();

        if (/^[0-9]+$/.test(imei)) {

          deviceStatus.imei = imei;

          console.log("IMEI received:", imei);

          socket.write(Buffer.from([0x01]));

          return;

        }

      } catch (err) {}

    }

    parseIO66(data);

    socket.write(Buffer.from([0x00,0x00,0x00,0x01]));

  });

  socket.on("close", () => {
    console.log("Device disconnected");
  });

  socket.on("error", (err) => {
    console.log("Socket error:", err.message);
  });

});

tcpServer.listen(TCP_PORT, () => {
  console.log("Teltonika TCP server running on port", TCP_PORT);
});

app.get("/status", (req, res) => {
  res.json(deviceStatus);
});

app.get("/", (req, res) => {

  res.send(`
  <html>
  <head>
  <title>Teltonika Status</title>
  <style>
  body { font-family: Arial; padding:40px }
  .row { font-size:22px; margin-bottom:10px }
  .alert { color:red; font-weight:bold }
  </style>
  </head>

  <body>

  <div class="row">Fordon: <span id="name"></span></div>
  <div class="row">IMEI: <span id="imei"></span></div>
  <div class="row">Status: <span id="status"></span></div>
  <div class="row">Last seen: <span id="last"></span></div>

  <script>

  async function update(){

    const res = await fetch("/status");
    const data = await res.json();

    document.getElementById("name").innerText = data.name;
    document.getElementById("imei").innerText = data.imei;
    document.getElementById("last").innerText = data.lastSeen;

    const statusEl = document.getElementById("status");
    statusEl.innerText = data.status;

    if(data.status === "Failed Test"){
      statusEl.className = "alert";
    } else {
      statusEl.className = "";
    }

  }

  setInterval(update,2000);
  update();

  </script>

  </body>
  </html>
  `);

});

app.listen(HTTP_PORT, () => {
  console.log("HTTP server running on port", HTTP_PORT);
});
