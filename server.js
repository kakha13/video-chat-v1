const express = require("express");
const { ExpressPeerServer } = require("peer");
const https = require("https");
const socketio = require("socket.io");
const fs = require("fs");

const app = express();

// HTTPS server configuration
const serverConfig = {
  key: fs.readFileSync("private.key"),
  cert: fs.readFileSync("certificate.crt"),
};

const server = https.createServer(serverConfig, app);
const io = socketio(server, {
  cors: {
    origin: "*",
  },
});
const peerServer = ExpressPeerServer(server, {
  debug: true,
});

app.use("/peerjs", peerServer);

app.get("/", (req, res, next) => {
  res.send("Hello world!");
});

// When a new socket.io connection is established

io.on("send", (socket) => {
  console.log(socket);
});


var allClients = [];

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId, userName) => {
    console.log(roomId, userId, userName);
    socket.join(roomId);

    setTimeout(() => {
      socket.broadcast.emit("user-connected", userId);
      console.log("first user connected");
    }, 1000);

    socket.on("message", (message) => {
      console.log(message);
      io.to(roomId).emit(
        "createMessage",
        message,
        userName,
        new Date().toLocaleTimeString()
      );
    });

    // disconected
    // socket.on('disconnect', function(){
    //   console.log("disconnected")
    //   console.log({roomId, userId, userName})
    //   socket.broadcast.to(roomId).emit('user_leave', userId);
    // });
    socket.on("disconnect", function () {
      console.log("Got disconnect!");

      var i = allClients.indexOf(socket);
      allClients.splice(i, 1);
      socket.broadcast.to(roomId).emit("user_leave", userId);
    });
  });
});

server.listen(3030, () => {
  console.log("Server is running on https://localhost");
});
