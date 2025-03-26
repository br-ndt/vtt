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
  const roomId = user.activeRoom;
  if (isGameRoomStateObject(roomDict[roomId])) {
    roomDict[roomId].players[user.id].commands[command.command] = command.value;
  }
}
