import alea from "alea";
import {
  Body,
  ConvexPolyhedron,
  Cylinder,
  Material,
  Sphere,
  Trimesh,
  Vec3,
  World,
} from "cannon-es";
import { randomUUID } from "crypto";
import { createNoise2D, NoiseFunction2D } from "simplex-noise";

import {
  COLLISION_GROUP_1,
  COLLISION_GROUP_2,
  COLLISION_GROUP_3,
  GROUND_HEIGHT,
  MAP_DEPTH,
  MAP_RESOLUTION,
  MAP_WIDTH,
} from "./constants";
import {
  GameRoomStateObject,
  RoomStateObject,
  Terrain,
  V3,
  WorldObject,
} from "./types";
import { getRandomIntInclusive } from "./util";

export function makeHeightFuncFromNoise(noise: NoiseFunction2D) {
  return (x: number, z: number) => {
    const frequency = 0.02;
    const amplitude = 5;

    const nx = x * frequency;
    const nz = z * frequency;

    // Combine octaves for richer variation
    let y =
      amplitude *
        (0.9 * noise(nx, nz) +
          0.2 * noise(nx * 2, nz * 2) +
          0.1 * noise(nx * 4, nz * 4)) +
      amplitude;

    return y;
  };
}

export function getSpawnPoint(
  heightFunc: (x: number, z: number) => number
): V3 {
  const x = getRandomIntInclusive(-MAP_WIDTH, MAP_WIDTH);
  const z = getRandomIntInclusive(-MAP_DEPTH, MAP_DEPTH);
  return {
    x,
    y: heightFunc(x, z) + 2,
    z,
  };
}

export default function generateTerrain(
  width: number,
  depth: number,
  segmentsX: number,
  segmentsZ: number,
  heightFunc: (x: number, z: number) => number
): Terrain {
  const vertices: number[] = [];
  const indices: number[] = [];

  const dx = width / segmentsX;
  const dz = depth / segmentsZ;

  const xOffset = -width / 2;
  const zOffset = -depth / 2;

  for (let iz = 0; iz <= segmentsZ; iz++) {
    for (let ix = 0; ix <= segmentsX; ix++) {
      const x = ix * dx + xOffset;
      const z = iz * dz + zOffset;
      const y = heightFunc(x, z);
      vertices.push(x, y, z);
    }
  }

  for (let iz = 0; iz < segmentsZ; iz++) {
    for (let ix = 0; ix < segmentsX; ix++) {
      const a = ix + (segmentsX + 1) * iz;
      const b = ix + (segmentsX + 1) * (iz + 1);
      const c = ix + 1 + (segmentsX + 1) * (iz + 1);
      const d = ix + 1 + (segmentsX + 1) * iz;

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  return {
    physics: new Trimesh(vertices, indices),
    serialized: {
      indices,
      vertices,
    },
  };
}

function generateSceneryObjects(
  seed: string,
  world: World,
  width: number,
  depth: number,
  segmentsX: number,
  segmentsZ: number,
  heightFunc: (x: number, z: number) => number,
  density: number = 0.5
): WorldObject[] {
  const rand = alea(seed + "_objects");
  const noise = createNoise2D(rand);
  const placementNoise = createNoise2D(rand);

  const dx = width / segmentsX;
  const dz = depth / segmentsZ;
  const xOffset = -width / 2;
  const zOffset = -depth / 2;

  const objects: WorldObject[] = [];

  for (let iz = 0; iz < segmentsZ; iz++) {
    for (let ix = 0; ix < segmentsX; ix++) {
      const x = ix * dx + xOffset;
      const z = iz * dz + zOffset;
      const y = heightFunc(x, z);

      // Use a second noise layer to decide if an object is placed
      const suitability = noise(x * 0.05, z * 0.05);
      if (suitability < 0.4) continue;

      // Estimate slope using finite difference
      const yx1 = heightFunc(x + 1, z);
      const yx2 = heightFunc(x - 1, z);
      const yz1 = heightFunc(x, z + 1);
      const yz2 = heightFunc(x, z - 1);
      const dxSlope = Math.abs(yx1 - yx2);
      const dzSlope = Math.abs(yz1 - yz2);
      const slope = Math.sqrt(dxSlope * dxSlope + dzSlope * dzSlope);

      if (slope > 1.5) continue;
      // Choose type based on noise + rand
      const placementValue = (placementNoise(x * 0.2, z * 0.2) + 1) / 2;
      if (placementValue > density) continue;

      const objectType = suitability > 0.6 ? "tree" : "rock";
      const physics = new Body({
        collisionFilterGroup: COLLISION_GROUP_1,
        collisionFilterMask: COLLISION_GROUP_2 | COLLISION_GROUP_3,
        mass: 200,
        material: new Material({ restitution: 0 }),
        position: new Vec3(x, y, z),
        shape:
          objectType === "tree" ? new Cylinder(1, 2, 12, 8) : new Sphere(0.3),
        type: Body.STATIC,
      });

      world.addBody(physics);

      objects.push({
        type: objectType,
        physics,
        position: [x, y, z],
        rotation: [0, 0, 0],
      });
    }
  }

  return objects;
}

export function createSimWorld(terrain: Trimesh) {
  const world = new World({
    gravity: new Vec3(0, -9.82, 0),
  });
  const groundBody = new Body({
    collisionFilterGroup: COLLISION_GROUP_1,
    collisionFilterMask: COLLISION_GROUP_2 | COLLISION_GROUP_3,
    material: new Material({ restitution: 0 }),
    shape: terrain,
    type: Body.STATIC,
  });
  groundBody.position.set(0, GROUND_HEIGHT - 0.1, 0);
  world.addBody(groundBody);
  return world;
}

export function createRoom(roomName: string): RoomStateObject {
  return {
    id: randomUUID(),
    messages: [],
    name: roomName,
    users: [],
  };
}

export function createGameRoom(roomName: string): GameRoomStateObject {
  const seed = alea(roomName);
  const noise = createNoise2D(seed);
  const heightFunc = makeHeightFuncFromNoise(noise);
  const terrain = generateTerrain(
    MAP_WIDTH * 2,
    MAP_DEPTH * 2,
    MAP_RESOLUTION,
    MAP_RESOLUTION,
    heightFunc
  );
  const world = createSimWorld(terrain.physics);
  const scenery = generateSceneryObjects(
    roomName,
    world,
    MAP_WIDTH * 2,
    MAP_DEPTH * 2,
    MAP_RESOLUTION,
    MAP_RESOLUTION,
    heightFunc
  );
  return {
    ...createRoom(roomName),
    heightFunc,
    objects: {
      bullets: [],
    },
    pending: {
      bulletsToRemove: [],
      playersToHarm: [],
      playersToRemove: [],
    },
    players: {},
    scenery,
    scores: {},
    terrain,
    world,
  };
}
