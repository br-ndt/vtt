import { Body, World } from "cannon-es";

export interface Player {
  commands: {
    fire?: boolean;
    left?: boolean;
    right?: boolean;
    up?: boolean;
    down?: boolean;
  };
  isJumping: boolean;
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

export interface GameRoomStateObject extends RoomStateObject {
  players: { [key: string]: Player };
  world: World;
}
