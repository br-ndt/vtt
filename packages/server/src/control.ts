import { RoomDict } from "./rooms";
import { isGameRoomStateObject, RoomStateObject } from "./types";

export interface Command {
  command: string;
  value: boolean;
}

export function controlHandler(
  user: Express.User,
  roomDict: RoomDict,
  command: Command
) {
  const room = roomDict[user.activeRoom];
  if (isGameRoomStateObject(room)) {
    room.players[user.id].commands[command.command] = command.value;
  }
}
