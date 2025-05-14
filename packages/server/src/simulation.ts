import {
  Body,
  Box,
  Cylinder,
  Material,
  Quaternion,
  Sphere,
  Vec3,
} from "cannon-es";
import { Server } from "socket.io";
import {
  AIMCONE,
  BULLET_FORCE,
  COLLISION_GROUP_2,
  COLLISION_GROUP_3,
  COOLDOWNS_DAMAGE,
  COOLDOWNS_DEATH,
  COOLDOWNS_FIRE,
  GROUND_HEIGHT,
  GROUND_THRESHOLD,
  JUMP_FORCE,
  KNOCKBACK_FORCE,
  MAP_DEPTH,
  MAP_WIDTH,
  PLAYER_MAX_HEALTH,
  PLAYER_RADIUS,
} from "./constants";
import { RoomDict } from "./rooms";
import {
  BulletStateObject,
  GameRoomStateObject,
  isGameRoomStateObject,
  Player,
  V3,
} from "./types";
import { getRandomIntInclusive, randomInRange } from "./util";
import {
  serializeObjects,
  serializePlayers,
  serializeScores,
} from "./messages";
import { getSpawnPoint } from "./world";

export function beginSimulation(io: Server, roomDict: RoomDict) {
  const FPS = 60;
  const dt = 1 / FPS; // time delta per frame

  setInterval(() => {
    Object.keys(roomDict)
      .filter((key) => key !== "lobby")
      .map((key) => roomDict[key])
      .forEach((room) => {
        if (isGameRoomStateObject(room)) {
          // deal damage to players hit last tick
          for (const player of room.pending.playersToHarm) {
            player.cooldowns.damage = COOLDOWNS_DAMAGE;
            player.health -= 1;
            if (player.health <= 0 && player.cooldowns.death === 0) {
              if (player.lastHitBy) {
                room.scores[player.lastHitBy] += 1;
              }
              player.cooldowns.death = COOLDOWNS_DEATH;
            }
          }
          // remove any player objects destroyed last tick
          for (const player of room.pending.playersToRemove) {
            room.world.removeBody(player.physics);
            const checkPlayer = room.players[player.userId];
            if (checkPlayer) {
              delete room.players[player.userId];
              room.players[player.userId] = makeNewPlayer(
                player.userId,
                player.username,
                getSpawnPoint(room.heightFunc)
              );
              room.world.addBody(room.players[player.userId].physics);
            }
          }
          // clear pending lists
          room.pending.bulletsToRemove = [];
          room.pending.playersToHarm = [];
          room.pending.playersToRemove = [];
          // physics step
          room.world.step(dt);
          Object.keys(room.players).forEach((id) => {
            stepPlayer(room.players[id], room, dt);
          });
          // remove bullets leaving the map
          for (const bullet of room.objects.bullets) {
            bullet.position = bullet.physics.position;
            if (
              (Math.abs(bullet.position.z) > MAP_DEPTH ||
                Math.abs(bullet.position.x) > MAP_WIDTH) &&
              !room.pending.bulletsToRemove.includes(bullet)
            ) {
              room.pending.bulletsToRemove.push(bullet);
            }
          }
          // remove any bullets pending removal
          for (const bullet of room.pending.bulletsToRemove) {
            room.world.removeBody(bullet.physics);
            const index = room.objects.bullets.findIndex((b) => b === bullet);
            if (index !== -1) room.objects.bullets.splice(index, 1);
          }
          // send out simulation state to room
          io.to(room.id).emit("update", {
            objects: serializeObjects(room.objects),
            players: serializePlayers(room.players),
            scores: serializeScores(room.players, room.scores),
          });
        }
      });
  }, 1000 / FPS);
}

export function makeNewPlayer(
  userId: string,
  username: string,
  position: V3
): Player {
  const body = new Body({
    collisionFilterGroup: COLLISION_GROUP_2,
    linearDamping: 0.8,
    mass: 5,
    material: new Material({ restitution: 0 }),
  });
  const cylinder = new Cylinder(PLAYER_RADIUS, PLAYER_RADIUS, PLAYER_RADIUS, 8);
  const quat = new Quaternion();
  quat.setFromAxisAngle(new Vec3(1, 0, 0), Math.PI / 2);
  body.addShape(cylinder, new Vec3(0, 1.5 * PLAYER_RADIUS, 0), quat);
  // Sphere (bottom cap)
  const sphereBottom = new Sphere(PLAYER_RADIUS);
  body.addShape(sphereBottom, new Vec3(0, PLAYER_RADIUS, 0));

  // Sphere (top cap)
  const sphereTop = new Sphere(PLAYER_RADIUS);
  body.addShape(sphereTop, new Vec3(0, 2 * PLAYER_RADIUS, 0));

  body.position.set(position.x, position.y, position.z);
  body.angularFactor = new Vec3(0, 1, 0);
  body.updateMassProperties();

  return {
    commands: {},
    cooldowns: {
      damage: 0,
      death: 0,
      fire: 0,
    },
    health: PLAYER_MAX_HEALTH,
    isJumping: false,
    lastHitBy: null,
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
  creator: Player,
  pitch: number,
  room: GameRoomStateObject
): BulletStateObject {
  const forward = new Vec3(0, 0, 1);
  const body = new Body({
    collisionFilterGroup: COLLISION_GROUP_3,
    collisionResponse: false,
    linearDamping: 0.4,
    mass: 1,
    shape: new Box(new Vec3(0.3, 0.3, 0.3)),
  });
  const recoilPitch = pitch + randomInRange(-AIMCONE, AIMCONE);
  const recoilYaw = creator.rotation.y + randomInRange(-AIMCONE, AIMCONE);
  body.quaternion = new Quaternion().setFromEuler(
    recoilPitch,
    recoilYaw,
    0,
    "YXZ"
  );
  const worldDirection = new Vec3();
  body.position.set(
    creator.position.x + worldDirection.x,
    creator.position.y + worldDirection.y + 0.75,
    creator.position.z + worldDirection.z
  );
  body.quaternion.vmult(forward, worldDirection);
  body.applyImpulse(worldDirection.scale(BULLET_FORCE), body.position);

  const bullet: BulletStateObject = {
    collided: false,
    playerId: creator.userId,
    physics: body,
    position: body.position,
    rotation: creator.rotation,
  };

  body.addEventListener("collide", (event) => {
    if (bullet.collided) {
      return;
    }
    const hitPlayer =
      event.body.collisionFilterGroup === COLLISION_GROUP_2
        ? room.players[
            Object.keys(room.players).find(
              (key) => room.players[key].physics.id === event.body.id
            ) ?? ""
          ]
        : undefined;
    if (hitPlayer && hitPlayer.userId !== creator.userId) {
      bullet.collided = true;
      if (!hitPlayer.cooldowns.damage) {
        const knockbackDir = body.quaternion.vmult(new Vec3(0, 0, 1));
        knockbackDir.normalize();
        hitPlayer.physics.applyImpulse(
          knockbackDir.scale(KNOCKBACK_FORCE),
          hitPlayer.physics.position
        );
        room.pending.playersToHarm.push(hitPlayer);
        hitPlayer.lastHitBy = creator.userId.toString();
      }
      room.pending.bulletsToRemove.push(bullet);
    } else if (event.body.collisionFilterGroup !== COLLISION_GROUP_2) {
      bullet.collided = true;
      room.pending.bulletsToRemove.push(bullet);
    }
  });

  return bullet;
}

export function stepPlayer(
  player: Player,
  room: GameRoomStateObject,
  dt: number
): Player {
  let vx = 0;
  let vz = 0;
  let yaw = 0;
  let pitch = 0;
  const speed = 15;
  const impulse = new Vec3(0, JUMP_FORCE, 0);
  let grounded = false;
  const terrainY = room.heightFunc(player.position.x, player.position.z);
  const dy = player.physics.position.y - terrainY;

  player.position = player.physics.position;

  if (dy <= GROUND_THRESHOLD) {
    grounded = true;
  }

  if (player.health > 0) {
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
    if (player.commands?.facing) {
      yaw = player.commands.facing?.yaw ?? yaw;
      pitch = player.commands.facing?.pitch ?? pitch;
    }
  }

  if (vx !== 0 && vz !== 0) {
    const magnitude = Math.sqrt(vx * vx + vz * vz);
    vx /= magnitude;
    vz /= magnitude;
  }

  vz *= -speed;
  vx *= speed / 2;

  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  if (player.health <= 0) {
    player.velocity.x = 0;
    player.velocity.z = 0;
  } else {
    player.velocity.x = cos * vx + sin * vz;
    player.velocity.z = cos * vz - sin * vx;
    if (player.position.x > MAP_WIDTH) {
      player.velocity.x = 0;
    } else if (player.position.x < -MAP_WIDTH) {
      player.velocity.x = 0;
    }

    if (player.position.z > MAP_DEPTH) {
      player.velocity.z = 0;
    } else if (player.position.z < -MAP_DEPTH) {
      player.velocity.z = 0;
    }
    player.rotation.y = yaw;
  }

  player.physics.velocity.x = player.velocity.x;
  player.physics.velocity.z = player.velocity.z;

  player.position.x = player.physics.position.x;
  player.position.z = player.physics.position.z;

  if (player.position.x > MAP_WIDTH) {
    player.position.x = MAP_WIDTH;
  } else if (player.position.x < -MAP_WIDTH) {
    player.position.x = -MAP_WIDTH;
  }
  if (player.position.z > MAP_DEPTH) {
    player.position.z = MAP_DEPTH;
  } else if (player.position.z < -MAP_DEPTH) {
    player.position.z = -MAP_DEPTH;
  }

  if (dy < GROUND_HEIGHT) {
    // fallen through: snap back to surface
    player.physics.position.y = terrainY;
    player.physics.velocity.y = 0;
    player.physics.angularVelocity.set(0, 0, 0);
    player.isJumping = false;
  } else if (dy < GROUND_THRESHOLD) {
    player.physics.position.y = terrainY;
    player.isJumping = false;
  }

  if (!player.isJumping && player.commands.jump && grounded) {
    player.physics.applyImpulse(impulse, player.physics.position);
    player.isJumping = true;
  }

  // make a bullet for every shooting player that can shoot
  if (
    player.health > 0 &&
    player.commands.fire &&
    player.cooldowns.fire === 0
  ) {
    const bullet = makeNewBullet(player, pitch, room);
    player.cooldowns.fire = COOLDOWNS_FIRE;
    room.world.addBody(bullet.physics);
    room.objects.bullets.push(bullet);
  }
  // tick cooldowns
  for (const key of Object.keys(player.cooldowns)) {
    if (player.cooldowns[key] > 0) {
      player.cooldowns[key] -= dt;
    }
    if (player.cooldowns[key] < 0) {
      player.cooldowns[key] = 0;
      // TODO do better somehow
      if (key === "death") {
        room.pending.playersToRemove.push(player);
      }
    }
  }

  return player;
}
