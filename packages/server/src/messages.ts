import { Server } from "socket.io";
import { BulletStateObject, Player, RoomStateObject } from "./types";

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

export function serializePlayers(playerDict: { [key: string]: Player }) {
  return Object.values(playerDict).map((player) => ({
    ...player,
    physics: undefined,
  }));
}

export function serializeObjects(objects: { bullets: BulletStateObject[] }) {
  return {
    bullets: objects.bullets.map((bullet) => ({
      ...bullet,
      physics: undefined,
    })),
  };
}
