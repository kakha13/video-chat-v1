const express = require("express");
const app = express();
const server = require("http").Server(app);
const { v4: uuidv4 } = require("uuid");
app.set("view engine", "ejs");
const io = require("socket.io")(server, {
  cors: {
    origin: '*'
  }
});
const { ExpressPeerServer } = require("peer");
const opinions = {
  debug: true,
}

app.use("/peerjs", ExpressPeerServer(server, opinions));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect(`/${uuidv4()}`);
});

app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});



io.on("send", (socket) => {
  console.log(socket)
})

var allClients = [];
io.on("connection", (socket) => {
  allClients.push(socket);
  console.log("connected")
  socket.on("join-room", (roomId, userId, userName) => {
    console.log(roomId, userId, userName)
    socket.join(roomId)
   
    setTimeout(()=>{
      socket.broadcast.emit("user-connected", userId);
      console.log("first user connected")
    }, 1000)

    socket.on("message", (message) => {
      console.log(message)
      io.to(roomId).emit("createMessage", message, userName, new Date().toLocaleTimeString());
    });

    // disconected
    // socket.on('disconnect', function(){
    //   console.log("disconnected")
    //   console.log({roomId, userId, userName})
    //   socket.broadcast.to(roomId).emit('user_leave', userId);
    // });
    socket.on('disconnect', function() {
      console.log('Got disconnect!');

      var i = allClients.indexOf(socket);
      allClients.splice(i, 1);
      socket.broadcast.to(roomId).emit('user_leave', userId);
   });

  });
});



server.listen(process.env.PORT || 3030);
