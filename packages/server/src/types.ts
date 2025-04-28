import { Body, World } from "cannon-es";

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
  userId: number;
  username: string;
  velocity: {
    x: number;
    y: number;
    z: number;
  };
}

export interface ServerStateObject {
  accounts: (Express.User & { password: string })[];
  rooms: {
    lobby: RoomStateObject;
    [key: string]: RoomStateObject | GameRoomStateObject;
  };
  users: Express.User[];
}

export interface RoomStateObject {
  id: string;
  messages: { user: string; content: string }[];
  name: string;
  users: Express.User[];
}

export function isGameRoomStateObject(
  room: RoomStateObject | GameRoomStateObject
): room is GameRoomStateObject {
  return (room as GameRoomStateObject)?.players !== undefined;
}

export interface BulletStateObject {
  playerId: number;
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
