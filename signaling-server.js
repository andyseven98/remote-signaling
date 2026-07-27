const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });
console.log("Signaling server running on port " + PORT);

let nextId = 1;
const clients = new Map();

wss.on("connection", (socket) => {
  const id = String(nextId++);
  clients.set(id, socket);
  console.log("Client " + id + " connected");

  socket.send(JSON.stringify({ type: "welcome", id: id }));

  socket.on("message", (data) => {
    let msg;
    try { msg = JSON.parse(data.toString()); } catch (e) { return; }
    msg.from = id;
    if (msg.to && clients.has(msg.to)) {
      clients.get(msg.to).send(JSON.stringify(msg));
    } else {
      for (const [cid, client] of clients) {
        if (cid !== id && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(msg));
        }
      }
    }
  });

  socket.on("close", () => {
    clients.delete(id);
    console.log("Client " + id + " disconnected");
  });
});