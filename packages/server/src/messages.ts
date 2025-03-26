import { Server } from "socket.io";
import { RoomStateObject } from "./types";

export function messageHandler(
  io: Server,
  user: Express.User,
  message: string,
  roomDict: { [key: string]: RoomStateObject }
) {
  console.log("Received message from client:", message);
  roomDict[user.activeRoom].messages.push({
    user: user.username,
    content: message,
  });
  io.to(user.activeRoom).emit("message", roomDict[user.activeRoom].messages);
}
