import bcrypt from "bcryptjs";
import express from "express";
import { createServer } from "http";
import session from "express-session";
import passport from "passport";
import { Server } from "socket.io";
import { beginSimulation } from "./simulation";
import { ServerStateObject } from "./types";
import { authenticatedRoute } from "./util";
import { setupSockets } from "./socket";
import { setupPassport } from "./auth";
import { setupMiddleware } from "./server";
import { setupServerState } from "./state";
import { createAuthRouter } from "./routes";

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
const state: ServerStateObject = setupServerState(curId);
const app = express();
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {},
  cors: {
    origin: "http://localhost:5173", // Vite default
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const sessionMiddleware = session({
  secret: process.env.SECRET ?? "secret",
  resave: true,
  saveUninitialized: true,
});

setupMiddleware(app, sessionMiddleware);

app.use("/auth", createAuthRouter(io, state.accounts, curId));

setupPassport(state.accounts);
setupSockets(io, sessionMiddleware, state.users, state.rooms);

beginSimulation(io, state.rooms);

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
