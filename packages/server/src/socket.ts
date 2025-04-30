import express from "express";
import { Server, Socket } from "socket.io";
import {
  changeRoom,
  changeRoomHandler,
  createRoomHandler,
  getRoomsHandler,
  RoomDict,
} from "./rooms";
import { messageHandler } from "./messages";
import { onlyForHandshake } from "./util";
import passport from "passport";
import { UserState } from "./types";
import User from "../db/models/User";

export async function connectHandler(
  socket: Socket,
  io: Server,
  userList: UserState[],
  roomDict: RoomDict
) {
  const req = socket.request as unknown as Request & { user: Express.User };
  const sockets = await io.in(`user:${req.user.uuid}`).fetchSockets();
  const isUserConnected = sockets.length > 0;
  const dbUser = await User.query().findOne({ uuid: req.user.uuid });
  if (!dbUser) {
    console.error(`No user with uuid ${req.user.uuid}`);
    return;
  }
  const user = { ...dbUser, activeRoom: "lobby" };

  socket.join(`user:${user.uuid}`);
  socket.join("lobby");

  console.log(`A user [${user.username}] has connected`);

  if (!isUserConnected) {
    userList.push(user);
  }

  socket.emit("message", roomDict[user.activeRoom]?.messages ?? []);
  socket.emit("room", user.activeRoom);

  socket.on("createRoom", () => {
    createRoomHandler(socket, io, user, roomDict);
  });

  socket.on("changeRoom", (roomId) => {
    changeRoomHandler(socket, io, user, roomDict, roomId);
  });

  socket.on("getRooms", () => {
    getRoomsHandler(socket, roomDict);
  });

  socket.on("message", (message) => {
    messageHandler(io, user, message, roomDict);
  });

  socket.on("disconnect", async () => {
    disconnectHandler(socket, io, user, userList, roomDict);
  });
}

export async function disconnectHandler(
  socket: Socket,
  io: Server,
  user: UserState,
  userList: UserState[],
  roomDict: RoomDict
) {
  const sockets = await io.in(`user:${user.uuid}`).fetchSockets();
  const lastSocket = sockets.length === 0;
  changeRoom(
    socket,
    io,
    user,
    roomDict,
    roomDict["lobby"],
    roomDict[user.activeRoom]
  );
  if (lastSocket) {
    userList.splice(userList.indexOf(user), 1);
    console.log(`A user [${user.username}] has disconnected`);
  }
}

export function setupSockets(
  io: Server,
  sessionMiddleware: express.RequestHandler,
  userList: UserState[],
  roomDict: RoomDict
) {
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
    connectHandler(socket, io, userList, roomDict);
  });
}
