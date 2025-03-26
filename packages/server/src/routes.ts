import bcrypt from "bcryptjs";
import express from "express";

import { authenticatedRoute } from "./util";
import passport from "passport";
import { Server } from "socket.io";

export function createAuthRouter(
  io: Server,
  accountList: (Express.User & { password: string })[],
  curId: number
) {
  const router = express.Router();
  router.get("/current", authenticatedRoute, (req, res) => {
    res.json({ ...req.user, password: undefined });
  });

  router.post("/register", async (req, res) => {
    const { username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    ++curId;
    const newUser = {
      activeRoom: "lobby",
      id: curId,
      username,
      password: hashedPassword,
    };
    accountList.push(newUser);

    res.status(201).send("User registered");
  });

  router.post("/login", passport.authenticate("local"), (req, res) => {
    res.json({ ...req.user, password: undefined });
  });

  router.get("/logout", (req, res) => {
    const sessionId = req.session.id;
    req.session.destroy(() => {
      // disconnect all Socket.IO connections linked to this session ID
      io.to(`session:${sessionId}`).disconnectSockets();
      res.status(204).end();
    });
  });

  return router;
}
