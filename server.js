const net = require("net");
const express = require("express");
const http = require("http");

const app = express();
const PORT = process.env.PORT || 10000;

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

    // ignorera Render health checks
    if (hex.startsWith("48454144") || hex.startsWith("474554")) {
      return;
    }

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

tcpServer.listen(PORT, () => {
  console.log("Teltonika TCP server running on port", PORT);
});

app.get("/status", (req, res) => {
  res.json(devices);
});

app.get("/", (req, res) => {

  res.send(`
  <html>
  <head>
  <title>Teltonika Monitor</title>
  <style>
  body { font-family: Arial; padding:40px }
  .row { font-size:22px; margin-bottom:10px }
  .alert { color:red; font-weight:bold }
  </style>
  </head>

  <body>

  <h2>Teltonika Device Monitor</h2>

  <div id="devices"></div>

  <script>

  async function update(){

    const res = await fetch("/status");
    const data = await res.json();

    const container = document.getElementById("devices");
    container.innerHTML = "";

    for(const imei in data){

      const d = data[imei];

      let statusClass = "";

      if(d.status === "Failed Test"){
        statusClass = "alert";
      }

      container.innerHTML += \`
        <div class="row">Fordon: \${d.name}</div>
        <div class="row">IMEI: \${d.imei}</div>
        <div class="row">Status: <span class="\${statusClass}">\${d.status}</span></div>
        <div class="row">Last seen: \${d.lastSeen}</div>
        <hr>
      \`;

    }

  }

  setInterval(update,2000);
  update();

  </script>

  </body>
  </html>
  `);

});

app.listen(PORT, () => {
  console.log("HTTP server running on port", PORT);
});
