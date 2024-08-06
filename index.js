import { Socket, Server } from "socket.io";
import { createServer } from "http";
import express from "express";

const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

let players = [];
let cells = [];

function generateCells() {
  cells = [];
  const cellCount = 120;
  const canvasSize = 2000; // Example canvas size, adjust as needed

  for (let i = 0; i < cellCount; i++) {
    let newCell;
    let overlapping;

    do {
      overlapping = false;
      const x = Math.random() * canvasSize - canvasSize / 2;
      const y = Math.random() * canvasSize - canvasSize / 2;
      const r = 10;

      newCell = { id: i, x, y, r };

      for (const cell of cells) {
        const d = Math.hypot(newCell.x - cell.x, newCell.y - cell.y);
        if (d < newCell.r + cell.r) {
          overlapping = true;
          break;
        }
      }
    } while (overlapping);

    cells.push(newCell);
  }
}

generateCells();

io.on("connection", (socket) => {
  //console.log(socket.id);
console.log(socket.handshake.query.name)
  const newPlayer = {
    id: socket.id,
    x: Math.random() * 400,
    y: Math.random() * 400,
    r: 20,
    name: socket.handshake.query.name === "${username.current}" ? "": socket.handshake.query.name
  };

  players.push(newPlayer);

  socket.emit("currentPlayers", players, cells);
  socket.broadcast.emit("newPlayer", newPlayer);

  socket.on("playerMovement", (movementData) => {
    const player = players.find(p => p.id === socket.id);
    if (player) {
      player.x = movementData.x;
      player.y = movementData.y;
      player.r = movementData.r;
      io.emit("playerMoved", player);
    }
  });

  socket.on("eatcell", (id) => {
    cells = cells.filter(p => p.id !== id);
    socket.broadcast.emit("eatencell", id);
  });
  socket.on("eatplayer", (id) => {
    players = players.filter(p => p.id !== id);
    socket.broadcast.emit("eatenplayer", id);
  });

  socket.on("disconnect", () => {
    console.log(socket.id)
    players = players.filter(p => p.id !== socket.id);
    io.emit("playerDisconnected", socket.id);
  });
});

server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
