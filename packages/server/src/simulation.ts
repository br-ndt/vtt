import { Body, Plane, Quaternion, Sphere, Vec3, World } from "cannon-es";
import { Server } from "socket.io";
import { MAX_HEIGHT, MAX_WIDTH } from "./constants";
import { RoomDict } from "./rooms";
import { BulletStateObject, isGameRoomStateObject, Player } from "./types";
import { getRandomIntInclusive } from "./util";
import { serializeObjects, serializePlayers } from "./messages";

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
            if (room.players[id].commands.fire) {
              const bullet = makeNewBullet(
                room.players[id].userId,
                room.players[id].position,
                room.players[id].rotation
              );
              room.world.addBody(bullet.physics);
              room.objects.bullets.push(bullet);
            }
          });
          for (const bullet of room.objects.bullets) {
            bullet.position = bullet.physics.position;
          }
          io.to(room.id).emit("update", {
            objects: serializeObjects(room.objects),
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
    y: 4,
    z: getRandomIntInclusive(-MAX_HEIGHT, MAX_HEIGHT),
  };

  const body = new Body({
    linearDamping: 0.8,
    mass: 5,
    shape: new Sphere(0.65),
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

function makeNewBullet(
  id: number,
  position: { x: number; y: number; z: number },
  rotation: { x: number; y: number; z: number }
): BulletStateObject {
  const forward = new Vec3(0, 0, 1);
  const body = new Body({
    linearDamping: 0.4,
    mass: 1,
    shape: new Sphere(0.1),
  });
  body.position.set(position.x, position.y + 1, position.z + 0.2);
  body.quaternion = new Quaternion().setFromEuler(
    rotation.x,
    rotation.y,
    rotation.z
  );
  const worldDirection = new Vec3();
  body.quaternion.vmult(forward, worldDirection);
  body.applyImpulse(worldDirection.scale(25), body.position);

  return {
    playerId: id,
    physics: body,
    position: body.position,
    rotation,
  };
}

export function stepPlayer(player: Player, dt: number): Player {
  let vx = 0;
  let vy = 0;
  let vz = 0;
  const speed = 15;
  const impulse = new Vec3(0, 100, 0);
  let jumpedThisFrame = false;

  if (!player.isJumping && player.commands.jump && player.position.y <= 0.65) {
    player.physics.applyImpulse(impulse, player.physics.position);
    player.isJumping = true;
    jumpedThisFrame = true;
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
  player.rotation.y += vx * (player.isJumping ? 0.4 : 1);

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

  if (player.position.y <= 0.65) {
    if (player.isJumping && !jumpedThisFrame) {
      player.isJumping = false;
      player.physics.velocity.set(0, 0, 0);
      player.physics.angularVelocity.set(0, 0, 0);
    }
    player.position.y = 0.65;
  }
  if (player.position.x > MAX_WIDTH) {
    player.position.x = MAX_WIDTH;
    player.physics.velocity.set(0, 0, 0);
  } else if (player.position.x < -MAX_WIDTH) {
    player.position.x = -MAX_WIDTH;
    player.physics.velocity.set(0, 0, 0);
  }

  if (player.position.z > MAX_HEIGHT) {
    player.position.z = MAX_HEIGHT;
    player.physics.velocity.set(0, 0, 0);
  } else if (player.position.z < -MAX_HEIGHT) {
    player.position.z = -MAX_HEIGHT;
    player.physics.velocity.set(0, 0, 0);
  }

  return player;
}
