import bcrypt from "bcryptjs";
import bodyParser from "body-parser";
import { randomUUID } from "crypto";
import express, { Request } from "express";
import { createServer } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Server } from "socket.io";
import { MAX_HEIGHT, MAX_WIDTH } from "./constants";
import { generateMockUser } from "./mocks";
import { createGameRoom, createRoom } from "./rooms";
import { stepPlayer } from "./simulation";
import {
  isGameRoomStateObject,
  RoomStateObject,
  ServerStateObject,
} from "./types";
import {
  authenticatedRoute,
  getRandomIntInclusive,
  onlyForHandshake,
} from "./util";

declare global {
  namespace Express {
    interface User {
      activeRoom: string;
      id: number;
      username: string;
    }
  }
}

let curId = 0;

const port = 3000;

// this should be a database at some point lol
const state: ServerStateObject = {
  accounts: [
    generateMockUser("foo", ++curId),
    generateMockUser("baz", ++curId),
  ],
  rooms: {
    lobby: {
      id: "lobby",
      messages: [],
      name: "Lobby",
      users: [],
    },
  },
  users: [],
};

const app = express();
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {},
  cors: {
    origin: "http://localhost:5173", // Vite's default dev server URL
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const sessionMiddleware = session({
  secret: process.env.SECRET ?? "secret",
  resave: true,
  saveUninitialized: true,
});
app.use(sessionMiddleware);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  res.send("Hello from the backend server!");
});

app.get("/api", (req, res) => {
  res.send(JSON.stringify("Hello from the API!"));
});

app.get("/auth/current", authenticatedRoute, (req, res) => {
  res.json({ ...req.user, password: undefined });
});

app.post("/auth/register", async (req, res) => {
  const { username, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);
  ++curId;
  const newUser = {
    activeRoom: "lobby",
    id: curId,
    username,
    password: hashedPassword,
  };
  state.accounts.push(newUser);

  res.status(201).send("User registered");
});

app.post("/auth/login", passport.authenticate("local"), (req, res) => {
  res.json({ ...req.user, password: undefined });
});

app.get("/auth/logout", (req, res, next) => {
  const sessionId = req.session.id;
  req.session.destroy(() => {
    // disconnect all Socket.IO connections linked to this session ID
    io.to(`session:${sessionId}`).disconnectSockets();
    res.status(204).end();
  });
});

passport.use(
  new LocalStrategy((username, password, done) => {
    const user = state.accounts.find((u) => u.username === username);
    if (!user) {
      console.log("Incorrect username");
      return done(null, false, { message: "Incorrect username" });
    }

    bcrypt.compare(password, user.password, (err, res) => {
      if (err) return done(err);
      if (!res) {
        console.log("Incorrect password");
        return done(null, false, { message: "Incorrect password" });
      }
      return done(null, user);
    });
  })
);

passport.serializeUser(
  (_req: Request, user: any, done: (arg0: null, arg1: string) => void) => {
    done(null, user);
  }
);

passport.deserializeUser((userData: Express.User, done) => {
  const user = state.accounts.find((u) => u.username === userData.username);
  done(null, user);
});

io.engine.use(onlyForHandshake(sessionMiddleware));
io.engine.use(onlyForHandshake(passport.session()));
io.engine.use(
  onlyForHandshake((req, res, next) => {
    if (req.user) {
      next();
    } else {
      res.writeHead(401);
      res.end();
    }
  })
);

io.on("connection", async (socket) => {
  const req = socket.request as Request & { user: Express.User };
  const sockets = await io.in(`user:${req.user.id}`).fetchSockets();
  const isUserConnected = sockets.length > 0;

  socket.join(`user:${req.user.id}`);
  socket.join(req.user.activeRoom);

  console.log(`A user [${req.user.username}] has connected`);

  if (!isUserConnected) {
    state.users.push(req.user);
  }

  socket.emit("message", state.rooms[req.user.activeRoom].messages);
  socket.emit("room", req.user.activeRoom);

  function leaveRoom(user: Express.User, room: RoomStateObject) {
    console.log(`${user.username} leaving ${room.name}`);
    socket.leave(room.id);
    room.users.splice(room.users.indexOf(user), 1);
    if (isGameRoomStateObject(room)) {
      delete room.players[user.id];
    }
    if (room.users.length <= 0 && room.id !== "lobby") {
      console.log(`deleting empty room ${room.name}`);
      delete state.rooms[room.id];
      io.to("lobby").emit(
        "rooms",
        Object.keys(state.rooms)
          .map((key) => {
            const room = state.rooms[key];
            if (isGameRoomStateObject(room)) {
              return {
                id: room.id,
                name: room.name,
                players: `${Object.keys(room.players).length} / 16`,
              };
            }
            console.log("oops");
          })
          .filter((room) => room !== undefined)
      );
    }
  }

  function changeRoom(user: Express.User, room: RoomStateObject) {
    leaveRoom(user, state.rooms[user.activeRoom]);

    console.log(`${user.username} entering ${room.name}`);
    socket.join(room.id);
    user.activeRoom = room.id;
    room.users.push(user);
    if (isGameRoomStateObject(room)) {
      room.players[user.id] = {
        commands: {},
        position: {
          x: getRandomIntInclusive(0, MAX_WIDTH),
          y: getRandomIntInclusive(0, MAX_HEIGHT),
        },
        userId: req.user.id,
      };
    }
    socket.emit("room", user.activeRoom);
    socket.emit("message", state.rooms[req.user.activeRoom].messages);
  }

  socket.on("createRoom", () => {
    const room = createGameRoom(
      `Cool Room #${Object.keys(state.rooms).length}`
    );
    state.rooms[room.id] = room;
    changeRoom(req.user, room);
    io.to("lobby").emit(
      "rooms",
      Object.keys(state.rooms)
        .map((key) => {
          const room = state.rooms[key];
          if (isGameRoomStateObject(room)) {
            return {
              id: room.id,
              name: room.name,
              players: `${Object.keys(room.players).length} / 16`,
            };
          }
          console.log("oops");
        })
        .filter((room) => room !== undefined)
    );
  });

  socket.on("changeRoom", (roomId) => {
    const room = state.rooms[roomId];
    if (room) {
      if (isGameRoomStateObject(room)) {
        if (Object.keys(room.players).length >= 16) {
          return;
        }
      }
      changeRoom(req.user, room);
    }
  });

  socket.on("getRooms", () => {
    socket.emit(
      "rooms",
      Object.keys(state.rooms)
        .map((key) => {
          const room = state.rooms[key];
          if (isGameRoomStateObject(room)) {
            return {
              id: room.id,
              name: room.name,
              players: `${Object.keys(room.players).length} / 16`,
            };
          }
        })
        .filter((room) => room !== undefined)
    );
  });

  socket.on("message", (data) => {
    console.log("Received message from client:", data);
    state.rooms[req.user.activeRoom].messages.push({
      user: req.user.username,
      content: data,
    });
    io.to(req.user.activeRoom).emit(
      "message",
      state.rooms[req.user.activeRoom].messages
    );
  });

  socket.on("control", (command: { command: string; value: boolean }) => {
    const roomId = req.user.activeRoom;
    if (isGameRoomStateObject(state.rooms[roomId])) {
      state.rooms[roomId].players[req.user.id].commands[command.command] =
        command.value;
    }
  });

  socket.on("disconnect", async () => {
    const sockets = await io.in(`user:${req.user.id}`).fetchSockets();
    const lastSocket = sockets.length === 0;
    if (lastSocket) {
      changeRoom(req.user, state.rooms["lobby"]);
      state.users.splice(state.users.indexOf(req.user), 1);
      console.log(`A user [${req.user.username}] has disconnected`);
    }
  });
});

const FPS = 60;
const dt = 1 / FPS; // time delta per frame
setInterval(() => {
  Object.keys(state.rooms)
    .filter((key) => key !== "lobby")
    .map((key) => state.rooms[key])
    .forEach((room) => {
      if (isGameRoomStateObject(room)) {
        Object.keys(room.players).forEach((id) => {
          room.players[id] = stepPlayer(room.players[id], dt);
        });
        io.to(room.id).emit("update", { players: room.players });
      }
    });
}, 1000 / FPS);

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
