import { Server } from "socket.io";
import { MAX_HEIGHT, MAX_WIDTH } from "./constants";
import { RoomDict } from "./rooms";
import { isGameRoomStateObject, Player } from "./types";

export function beginSimulation(io: Server, roomDict: RoomDict) {
  const FPS = 60;
  const dt = 1 / FPS; // time delta per frame
  setInterval(() => {
    Object.keys(roomDict)
      .filter((key) => key !== "lobby")
      .map((key) => roomDict[key])
      .forEach((room) => {
        if (isGameRoomStateObject(room)) {
          Object.keys(room.players).forEach((id) => {
            room.players[id] = stepPlayer(room.players[id], dt);
          });
          io.to(room.id).emit("update", { players: room.players });
        }
      });
  }, 1000 / FPS);
}

export function stepPlayer(player: Player, dt: number): Player {
  let vy = 0;
  let vx = 0;
  const speed = 100;
  if (player.commands.down) {
    if (!player.commands.up) {
      vy = 1;
    }
  } else if (player.commands.up) {
    vy = -1;
  }
  if (player.commands.right) {
    if (!player.commands.left) {
      vx = 1;
    }
  } else if (player.commands.left) {
    vx = -1;
  }
  if (vx !== 0 && vy !== 0) {
    const magnitude = Math.sqrt(vx * vx + vy * vy);
    vx /= magnitude;
    vy /= magnitude;
  }
  vx *= speed * dt;
  vy *= speed * dt;

  player.position.x += vx;
  if (player.position.x > MAX_WIDTH) {
    player.position.x = 0;
  } else if (player.position.x < 0) {
    player.position.x = MAX_WIDTH;
  }

  player.position.y += vy;
  if (player.position.y > MAX_HEIGHT) {
    player.position.y = 0;
  } else if (player.position.y < 0) {
    player.position.y = MAX_HEIGHT;
  }

  return player;
}
