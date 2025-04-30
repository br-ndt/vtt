import { RoomDict } from "./rooms";
import { isGameRoomStateObject, UserState } from "./types";

export interface Command {
  command: string;
  value: boolean;
}

export function controlHandler(
  user: UserState,
  roomDict: RoomDict,
  command: Command
) {
  const room = roomDict[user.activeRoom];
  if (isGameRoomStateObject(room)) {
    room.players[user.uuid].commands[command.command] = command.value;
  }
}
