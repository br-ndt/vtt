import { configDotenv } from "dotenv";
import express from "express";
import session from "express-session";
import { createServer } from "http";
import Knex from "knex";
import { knexSnakeCaseMappers, Model } from "objection";
import { Server } from "socket.io";

import { setupPassport } from "./auth";
import { createAuthRouter } from "./routes";
import { setupMiddleware } from "./server";
import { beginSimulation } from "./simulation";
import { setupSockets } from "./socket";
import { setupServerState } from "./state";
import { ServerStateObject } from "./types";

declare global {
  namespace Express {
    interface User {
      email: string;
      id: number;
      uuid: string;
      username: string;
      verificationToken: string;
      verified: boolean;
    }
  }
}

configDotenv();

const port = process.env.PORT || 3000;

Model.knex(
  Knex({
    client: "pg",
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_DEFAULT,
    },
    migrations: {
      directory: "./db/migrations",
    },
    ...knexSnakeCaseMappers(),
  })
);
const state: ServerStateObject = setupServerState();
const app = express();
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {},
  cors: {
    origin: process.env.HOSTNAME,
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

app.use("/auth", createAuthRouter(io));

setupPassport();
setupSockets(io, sessionMiddleware, state.connected, state.rooms);

beginSimulation(io, state.rooms);

// Start the server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
