import { Body, Trimesh, World } from "cannon-es";
import User from "../db/models/User";

export interface V3 {
  x: number;
  y: number;
  z: number;
}

export interface Player {
  commands: {
    facing?: {
      pitch?: number;
      yaw?: number;
    };
    fire?: boolean;
    jump?: boolean;
    left?: boolean;
    right?: boolean;
    up?: boolean;
    down?: boolean;
  };
  cooldowns: {
    damage: number;
    death: number;
    fire: number;
  };
  health: number;
  isJumping: boolean;
  lastHitBy: string | null;
  physics: Body;
  position: V3;
  rotation: V3;
  selected: boolean;
  userId: string;
  username: string;
  velocity: V3;
}

export interface WorldObject {
  type: "tree" | "rock";
  position: [number, number, number];
  physics: Body;
  rotation: [number, number, number];
}

export interface UserState extends Pick<User, "username" | "uuid"> {
  activeRoom: string;
}

export interface ServerStateObject {
  connected: UserState[];
  rooms: {
    lobby: RoomStateObject;
    [key: string]: RoomStateObject | GameRoomStateObject;
  };
}

export interface RoomStateObject {
  id: string;
  messages: { user: string; content: string }[];
  name: string;
  users: UserState[];
}

export function isGameRoomStateObject(
  room: RoomStateObject | GameRoomStateObject
): room is GameRoomStateObject {
  return (room as GameRoomStateObject)?.players !== undefined;
}

export interface BulletStateObject {
  collided: boolean;
  playerId: string;
  physics: Body;
  position: V3;
  rotation: V3;
}

export interface GameRoomStateObject extends RoomStateObject {
  heightFunc: (x: number, z: number) => number;
  objects: {
    bullets: BulletStateObject[];
  };
  pending: {
    bulletsToRemove: BulletStateObject[];
    playersToHarm: Player[];
    playersToRemove: Player[];
  };
  players: { [key: string]: Player };
  scenery: WorldObject[];
  scores: {
    [key: string]: number;
  };
  terrain: Terrain;
  world: World;
}

export interface Terrain {
  physics: Trimesh;
  serialized: {
    indices: number[];
    vertices: number[];
  };
}
