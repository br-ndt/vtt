import bcrypt from "bcryptjs";
import express, { Request } from "express";
import { createServer } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Server } from "socket.io";
import { getRandomIntInclusive } from "./util";
import { stepPlayer } from "./simulation";
import { Player, StateObject, User } from "./types";

const port = 3000;

function generateMockUser(): User {
  const password = bcrypt.hashSync("bar", 10);
  return {
    username: "foo",
    password,
  };
}

// this should be a database at some point lol
const state: StateObject = {
  messages: [],
  players: {},
  users: [generateMockUser()],
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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "your-secret-key", // Change to a more secure secret in production
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(
  new LocalStrategy((username, password, done) => {
    const user = state.users.find((u) => u.username === username);
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
    done(null, user.username);
  }
);

passport.deserializeUser((username, done) => {
  const user = state.users.find((u) => u.username === username);
  done(null, user ? { username: user?.username } : undefined);
});

// Set up a simple HTTP route
app.get("/", (req, res) => {
  res.send("Hello from the backend server!");
});

app.get("/api", (req, res) => {
  res.send(JSON.stringify("Hello from the API!"));
});

app.get("/auth/current", (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).send("Not authenticated");
  }
});

app.post("/auth/register", async (req, res) => {
  const { username, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = { username, password: hashedPassword };
  state.users.push(newUser);

  res.status(201).send("User registered");
});

app.post("/auth/login", passport.authenticate("local"), (req, res) => {
  const resUser = req.user as User;
  res.json({ username: resUser.username });
});

app.get("/auth/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.json({});
  });
});

io.on("connection", (socket) => {
  console.log("A user connected");
  const newPlayer: Player = {
    commands: {},
    position: {
      x: getRandomIntInclusive(0, 500),
      y: getRandomIntInclusive(0, 500),
    },
  };
  socket.emit("message", state.messages);
  state.players[socket.id] = newPlayer;

  socket.on("message", (data) => {
    console.log("Received message from client:", data);
    state.messages.push({ user: socket.id, content: data });
    io.sockets.emit("message", state.messages);
  });

  socket.on("control", (command: { command: string; value: boolean }) => {
    state.players[socket.id].commands[command.command] = command.value;
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
    delete state.players[socket.id];
  });
});

const FPS = 60;
const dt = 1 / FPS; // time delta per frame
setInterval(() => {
  Object.keys(state.players).forEach((id) => {
    state.players[id] = stepPlayer(state.players[id], dt);
  });

  io.emit("update", { players: state.players });
}, 1000 / FPS);

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
