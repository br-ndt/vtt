import { Body, Box, Plane, Quaternion, Sphere, Vec3, World } from "cannon-es";
import { Server } from "socket.io";
import {
  GROUND_HEIGHT,
  MAX_HEIGHT,
  MAX_WIDTH,
  PLAYER_MAX_HEALTH,
} from "./constants";
import { RoomDict } from "./rooms";
import { BulletStateObject, isGameRoomStateObject, Player } from "./types";
import { getRandomIntInclusive } from "./util";
import {
  serializeObjects,
  serializePlayers,
  serializeScores,
} from "./messages";

const GROUP_1 = 1;
const GROUP_2 = 2;
const GROUP_3 = 3;

export function beginSimulation(io: Server, roomDict: RoomDict) {
  const FPS = 60;
  const dt = 1 / FPS; // time delta per frame

  setInterval(() => {
    Object.keys(roomDict)
      .filter((key) => key !== "lobby")
      .map((key) => roomDict[key])
      .forEach((room) => {
        if (isGameRoomStateObject(room)) {
          for (const player of room.pending.playersToHarm) {
            player.cooldowns.damage = 1;
            player.health -= 1;
            if (player.health <= 0 && player.cooldowns.death === 0) {
              if (player.lastHitById) {
                room.scores[player.lastHitById] += 1;
              }
              player.cooldowns.death = 3;
            }
          }
          for (const player of room.pending.playersToRemove) {
            room.world.removeBody(player.physics);
            const checkPlayer = room.players[player.userId];
            if (checkPlayer) {
              delete room.players[player.userId];
              room.players[player.userId] = room.players[player.userId] =
                makeNewPlayer(player.userId, player.username);
              room.world.addBody(room.players[player.userId].physics);
            }
          }
          room.pending.bulletsToRemove = [];
          room.pending.playersToHarm = [];
          room.pending.playersToRemove = [];
          room.world.step(dt);
          Object.keys(room.players).forEach((id) => {
            room.players[id].position = room.players[id].physics.position;
            stepPlayer(room.players[id], dt);
            if (
              room.players[id].health > 0 &&
              room.players[id].commands.fire &&
              room.players[id].cooldowns.fire === 0
            ) {
              const bullet = makeNewBullet(
                room.players[id].userId,
                room.players[id].position,
                room.players[id].rotation
              );
              bullet.physics.addEventListener("collide", (event) => {
                console.log(bullet.rotation);
                const player =
                  event.body.collisionFilterGroup === GROUP_2
                    ? room.players[
                        Object.keys(room.players).find(
                          (key) =>
                            room.players[key].physics.id === event.body.id
                        ) ?? ""
                      ]
                    : undefined;
                if (player && player.userId !== bullet.playerId) {
                  if (!player.cooldowns.damage) {
                    const knockbackDir = bullet.physics.quaternion.vmult(
                      new Vec3(-1, -1, -1)
                    );
                    knockbackDir.normalize();
                    player.physics.applyImpulse(
                      knockbackDir.scale(20),
                      player.physics.position
                    );
                    room.pending.playersToHarm.push(player);
                    player.lastHitById = id;
                  }
                  room.pending.bulletsToRemove.push(bullet);
                }
              });
              room.players[id].cooldowns.fire = 0.5;
              room.world.addBody(bullet.physics);
              room.objects.bullets.push(bullet);
            }
            if (room.players[id].cooldowns.fire > 0) {
              room.players[id].cooldowns.fire -= dt;
              if (room.players[id].cooldowns.fire < 0) {
                room.players[id].cooldowns.fire = 0;
              }
            }
            if (room.players[id].cooldowns.damage > 0) {
              room.players[id].cooldowns.damage -= dt;
              if (room.players[id].cooldowns.damage < 0) {
                room.players[id].cooldowns.damage = 0;
              }
            }
            if (room.players[id].cooldowns.death > 0) {
              room.players[id].cooldowns.death -= dt;
              if (room.players[id].cooldowns.death < 0) {
                room.players[id].cooldowns.death = 0;
                room.pending.playersToRemove.push(room.players[id]);
              }
            }
          });
          for (const bullet of room.objects.bullets) {
            bullet.position = bullet.physics.position;
            if (
              (Math.abs(bullet.position.z) > MAX_HEIGHT ||
                Math.abs(bullet.position.x) > MAX_WIDTH) &&
              !room.pending.bulletsToRemove.includes(bullet)
            ) {
              room.pending.bulletsToRemove.push(bullet);
            }
          }
          for (const bullet of room.pending.bulletsToRemove) {
            room.world.removeBody(bullet.physics);
            const index = room.objects.bullets.findIndex((b) => b === bullet);
            if (index !== -1) room.objects.bullets.splice(index, 1);
          }
          io.to(room.id).emit("update", {
            objects: serializeObjects(room.objects),
            players: serializePlayers(room.players),
            scores: serializeScores(room.players, room.scores),
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
    collisionFilterGroup: GROUP_1,
    collisionFilterMask: GROUP_2 | GROUP_3,
    shape: new Plane(),
    type: Body.STATIC,
  });
  groundBody.position.set(0, GROUND_HEIGHT - 0.1, 0);
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
    collisionFilterGroup: GROUP_2,
    linearDamping: 0.8,
    mass: 5,
    shape: new Sphere(0.65),
  });
  body.position.set(position.x, position.y, position.z);

  return {
    commands: {},
    cooldowns: {
      damage: 0,
      death: 0,
      fire: 0,
    },
    health: PLAYER_MAX_HEALTH,
    isJumping: false,
    lastHitById: null,
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
    collisionFilterGroup: GROUP_3,
    collisionResponse: false,
    linearDamping: 0.4,
    mass: 1,
    shape: new Box(new Vec3(0.3, 0.3, 0.3)),
  });
  body.position.set(position.x, position.y + 1, position.z + 0.35);
  body.quaternion = new Quaternion().setFromEuler(
    rotation.x,
    rotation.y,
    rotation.z
  );
  const worldDirection = new Vec3();
  body.quaternion.vmult(forward, worldDirection);
  body.applyImpulse(worldDirection.scale(50), body.position);

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

  if (player.health > 0) {
    if (
      !player.isJumping &&
      player.commands.jump &&
      player.position.y <= GROUND_HEIGHT + 0.65
    ) {
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

  if (player.position.y <= GROUND_HEIGHT + 0.65) {
    if (player.isJumping && !jumpedThisFrame) {
      player.isJumping = false;
      player.physics.velocity.set(0, 0, 0);
      player.physics.angularVelocity.set(0, 0, 0);
    }
    player.position.y = GROUND_HEIGHT + 0.65;
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
