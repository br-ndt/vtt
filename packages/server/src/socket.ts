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

export async function connectHandler(
  socket: Socket,
  io: Server,
  userList: Express.User[],
  roomDict: RoomDict
) {
  const req = socket.request as unknown as Request & { user: Express.User };
  const sockets = await io.in(`user:${req.user.id}`).fetchSockets();
  const isUserConnected = sockets.length > 0;

  socket.join(`user:${req.user.id}`);
  socket.join(req.user.activeRoom);

  console.log(`A user [${req.user.username}] has connected`);

  if (!isUserConnected) {
    userList.push(req.user);
  }

  socket.emit("message", roomDict[req.user.activeRoom].messages);
  socket.emit("room", req.user.activeRoom);

  socket.on("createRoom", () => {
    createRoomHandler(socket, io, req.user, roomDict);
  });

  socket.on("changeRoom", (roomId) => {
    changeRoomHandler(socket, io, req.user, roomDict, roomId);
  });

  socket.on("getRooms", () => {
    getRoomsHandler(socket, roomDict);
  });

  socket.on("message", (message) => {
    messageHandler(io, req.user, message, roomDict);
  });

  socket.on("disconnect", async () => {
    disconnectHandler(socket, io, req.user, userList, roomDict);
  });
}

export async function disconnectHandler(
  socket: Socket,
  io: Server,
  user: Express.User,
  userList: Express.User[],
  roomDict: RoomDict
) {
  const sockets = await io.in(`user:${user.id}`).fetchSockets();
  const lastSocket = sockets.length === 0;
  if (lastSocket) {
    changeRoom(
      socket,
      io,
      user,
      roomDict,
      roomDict["lobby"],
      roomDict[user.activeRoom]
    );
    userList.splice(userList.indexOf(user), 1);
    console.log(`A user [${user.username}] has disconnected`);
  }
}

export function setupSockets(
  io: Server,
  sessionMiddleware: express.RequestHandler,
  userList: Express.User[],
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
