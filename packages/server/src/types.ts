import { Body, World } from "cannon-es";
import User from "../db/models/User";

export interface Player {
  commands: {
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
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
  selected: boolean;
  userId: string;
  username: string;
  velocity: {
    x: number;
    y: number;
    z: number;
  };
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
  playerId: string;
  physics: Body;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
}

export interface GameRoomStateObject extends RoomStateObject {
  objects: {
    bullets: BulletStateObject[];
  };
  pending: {
    bulletsToRemove: BulletStateObject[];
    playersToHarm: Player[];
    playersToRemove: Player[];
  };
  players: { [key: string]: Player };
  scores: {
    [key: string]: number;
  };
  world: World;
}
