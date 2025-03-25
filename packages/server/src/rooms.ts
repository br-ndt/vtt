import { randomUUID } from "crypto";
import { GameRoomStateObject, RoomStateObject } from "./types";

export function createRoom(roomName: string): RoomStateObject {
  return {
    id: randomUUID(),
    messages: [],
    name: roomName,
    users: [],
  };
}

export function createGameRoom(roomName: string): GameRoomStateObject {
  return {
    ...createRoom(roomName),
    players: {},
  };
}
