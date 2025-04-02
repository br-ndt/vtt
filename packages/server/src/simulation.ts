import { Body, Box, Plane, Sphere, Vec3, World } from "cannon-es";
import { Server } from "socket.io";
import { MAX_HEIGHT, MAX_WIDTH } from "./constants";
import { RoomDict } from "./rooms";
import { isGameRoomStateObject, Player, RoomStateObject } from "./types";
import { getRandomIntInclusive } from "./util";
import { serializePlayers } from "./messages";

export function beginSimulation(io: Server, roomDict: RoomDict) {
  const FPS = 60;
  const dt = 1 / FPS; // time delta per frame

  setInterval(() => {
    Object.keys(roomDict)
      .filter((key) => key !== "lobby")
      .map((key) => roomDict[key])
      .forEach((room) => {
        if (isGameRoomStateObject(room)) {
          room.world.step(dt);
          Object.keys(room.players).forEach((id) => {
            room.players[id].position = room.players[id].physics.position;
            stepPlayer(room.players[id], dt);
          });
          io.to(room.id).emit("update", {
            players: serializePlayers(room.players),
          });
        }
      });
  }, 1000 / FPS);
}

export function createSimWorld() {
  const world = new World({
    gravity: new Vec3(0, -9.82, 0),
  });
  const groundBody = new Body({
    type: Body.STATIC,
    shape: new Plane(),
  });
  groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  world.addBody(groundBody);
  return world;
}

export function makeNewPlayer(userId: number, username: string) {
  const position = {
    x: getRandomIntInclusive(-MAX_WIDTH, MAX_WIDTH),
    y: 10,
    z: getRandomIntInclusive(-MAX_HEIGHT, MAX_HEIGHT),
  };

  const body = new Body({
    linearDamping: 0.8,
    mass: 5,
    shape: new Sphere(0.85),
  });
  body.position.set(position.x, position.y, position.z);

  return {
    commands: {},
    isJumping: false,
    physics: body,
    position,
    rotation: {
      x: 0,
      y: 0,
      z: 0,
    },
    selected: false,
    userId,
    username,
    velocity: {
      x: 0,
      y: 0,
      z: 0,
    },
  };
}

export function stepPlayerNew(player: Player, dt: number) {
  let vx = 0;
  let vz = 0;
  const speed = 10;
  const impulse = new Vec3(0, 100, 0);
  if (!player.isJumping && player.commands.fire) {
    player.physics.applyImpulse(impulse, player.physics.position);
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

  vz *= speed * dt;
  vx *= (speed / 4) * dt;
  player.rotation.y += vx;

  if (player.rotation.y > 2 * Math.PI) {
    player.rotation.y -= 2 * Math.PI;
  } else if (player.rotation.y < 0) {
    player.rotation.y += 2 * Math.PI;
  }

  const force = new Vec3(
    Math.sin(player.rotation.y) * vz * 10,
    0,
    Math.cos(player.rotation.y) * vz * 10
  );
  player.physics.applyForce(force, player.physics.position);

  if (player.position.y < 1) {
    player.isJumping = false;
    player.position.y = 1;
  }
  if (player.position.x > MAX_WIDTH) {
    player.position.x = -MAX_WIDTH;
  } else if (player.position.x < -MAX_WIDTH) {
    player.position.x = MAX_WIDTH;
  }

  if (player.position.z > MAX_HEIGHT) {
    player.position.z = -MAX_HEIGHT;
  } else if (player.position.z < -MAX_HEIGHT) {
    player.position.z = MAX_HEIGHT;
  }
  player.physics.position = new Vec3(
    player.position.x,
    player.position.y,
    player.position.z
  );
}

export function stepPlayer(player: Player, dt: number): Player {
  let vx = 0;
  let vy = 0;
  let vz = 0;
  const speed = 15;

  if (!player.isJumping && player.commands.fire) {
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

  vz *= -speed * dt;
  vx *= (speed / 8) * dt;
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

  if (player.position.y < 0) {
    player.isJumping = false;
    player.position.y = 0;
  }
  if (player.position.x > MAX_WIDTH) {
    player.position.x = -MAX_WIDTH;
  } else if (player.position.x < -MAX_WIDTH) {
    player.position.x = MAX_WIDTH;
  }

  if (player.position.z > MAX_HEIGHT) {
    player.position.z = -MAX_HEIGHT;
  } else if (player.position.z < -MAX_HEIGHT) {
    player.position.z = MAX_HEIGHT;
  }

  return player;
}
