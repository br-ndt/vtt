import { Server } from "socket.io";
import { BulletStateObject, Player, RoomStateObject, UserState } from "./types";

export function messageHandler(
  io: Server,
  user: UserState,
  message: string,
  roomDict: { [key: string]: RoomStateObject }
) {
  console.log(`Message from ${user.username} in ${user.activeRoom}:`, message);
  roomDict[user.activeRoom].messages.push({
    user: user.username,
    content: message,
  });
  io.to(user.activeRoom).emit("message", roomDict[user.activeRoom].messages);
}

export function serializePlayers(playerDict: { [key: string]: Player }) {
  return Object.keys(playerDict).reduce(
    (prev, key) => ({
      ...prev,
      [key]: {
        ...playerDict[key],
        cooldowns: undefined,
        lastHitBy: playerDict[playerDict[key].lastHitBy ?? ""]?.username ?? "",
        physics: undefined,
        state:
          playerDict[key].health <= 0
            ? "dead"
            : playerDict[key].cooldowns.damage > 0
            ? "damaged"
            : "normal",
      },
    }),
    {}
  );
}

export function serializeObjects(objects: { bullets: BulletStateObject[] }) {
  return {
    bullets: objects.bullets.map((bullet) => ({
      ...bullet,
      physics: undefined,
    })),
  };
}

export function serializeScores(
  playerDict: { [key: string]: Player },
  scores: { [key: string]: number }
) {
  return Object.keys(playerDict).reduce((prev, cur) => {
    prev[playerDict[cur].username] = scores[cur];
    return prev;
  }, {});
}
