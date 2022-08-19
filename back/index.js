const express = require("express");
const session = require("express-session");
const app = express();
const http = require("http");
const path = require("path");

const { disconnect } = require("process");
const server = require("http").createServer(app);
const cors = require("cors");
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    credentials: true,
  },
});

// const sessionMiddleware = session({
//   secret: "secret",
//   resave: false,
//   saveUninitialized: false,
// });

// app.use(sessionMiddleware);
app.use(express.static(path.join(__dirname, "build")));

let userList = [];

// app.get("/", (req, res) => {
//   if (!req.session.counter) {
//     req.session.counter = 1;
//   } else {
//     req.session.counter += 1;
//   }
//   console.log(req.session.counter);
//   res.sendFile(__dirname + "/index.html");
// });

// const wrap = (middleware) => (socket, next) =>
//   middleware(socket.request, {}, next);

// io.use(wrap(sessionMiddleware));

// io.on("connection", (socket) => {
//   console.log("a user connected");
//   socket.on("disconnect", () => {
//     console.log("user disconnected");
//   });
// });

// io.on("connection", (socket) => {
//   socket.on("chat message", (msg) => {
//     console.log("message: " + msg);
//   });
// });

io.on("connection", (socket) => {
  let addedUser = false;

  socket.on("add user", (username) => {
    // console.log(username);
    // console.log(userList);

    // if (addedUser) {
    //   socket.emit("login", socket.username);
    // }

    if (addedUser) return;

    if (userList.includes(username)) return;

    if (username === "System") return;

    // we store the username in the socket session for this client
    socket.username = username;
    userList.push(username);
    addedUser = true;
    socket.emit("login", {
      username: socket.username,
      userList: userList,
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit("user joined", {
      username: socket.username,
      userList: userList,
    });
  });

  socket.on("new message", (data) => {
    // we tell the client to execute 'new message'
    socket.broadcast.emit("new message", {
      username: socket.username,
      message: data,
    });
  });

  socket.on("sync", (data) => {
    // we tell the client to execute 'new message'
    console.log(data);
    socket.broadcast.emit("sync", data);
  });

  socket.on("disconnect", () => {
    if (addedUser) {
      const index = userList.indexOf(socket.username);
      if (index > -1) {
        userList.splice(index, 1);
      }
      socket.broadcast.emit("user left", {
        username: socket.username,
        userList: userList,
      });
    }
  });
});

const port = 4000;

server.listen(port, () => {
  console.log(`listening on *:${port}`);
});
