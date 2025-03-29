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
  let vx = 0;
  let vy = 0;
  let vz = 0;
  const speed = 10;

  if (!player.isJumping && player.commands.fire) {
    player.velocity.y = 10;
    player.isJumping = true;
  }

  if (player.commands.down) {
    if (!player.commands.up) {
      vz = 1;
    }
  } else if (player.commands.up) {
    vz = -1;
  }
  if (player.commands.right) {
    if (!player.commands.left) {
      vx = -1;
    }
  } else if (player.commands.left) {
    vx = 1;
  }

  if (vx !== 0 && vz !== 0) {
    const magnitude = Math.sqrt(vx * vx + vz * vz);
    vx /= magnitude;
    vz /= magnitude;
  }

  if (player.position.y > 0.5) {
    player.velocity.y += -9.8 * dt;
  }
  vz *= speed * dt;
  vx *= (speed / 4) * dt;
  player.rotation.y += vx;

  if (player.rotation.y > 2 * Math.PI) {
    player.rotation.y -= 2 * Math.PI;
  } else if (player.rotation.y < 0) {
    player.rotation.y += 2 * Math.PI;
  }

  player.velocity.x = vx;
  player.velocity.y += vy;
  player.velocity.z = vz;

  player.position.x += Math.sin(player.rotation.y) * player.velocity.z;
  player.position.y += player.velocity.y * dt;
  player.position.z += Math.cos(player.rotation.y) * player.velocity.z;

  if (player.position.y < 0.5) {
    player.isJumping = false;
    player.position.y = 0.5;
  }
  if (player.position.x > MAX_WIDTH) {
    player.position.x %= -MAX_WIDTH;
  } else if (player.position.x < -MAX_WIDTH) {
    player.position.x %= MAX_WIDTH;
  }

  if (player.position.z > MAX_HEIGHT) {
    player.position.z %= -MAX_HEIGHT;
  } else if (player.position.z < -MAX_HEIGHT) {
    player.position.z %= MAX_HEIGHT;
  }

  return player;
}
