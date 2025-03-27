import { RoomDict } from "./rooms";
import { isGameRoomStateObject, RoomStateObject } from "./types";

export interface Command {
  command: string;
  value: boolean;
}

export function controlHandler(
  user: Express.User,
  room: RoomStateObject,
  command: Command
) {
  const roomId = user.activeRoom;
  if (isGameRoomStateObject(room)) {
    room.players[user.id].commands[command.command] = command.value;
  }
}
