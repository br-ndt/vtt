export interface Player {
  commands: {
    left?: boolean;
    right?: boolean;
    up?: boolean;
    down?: boolean;
  };
  position: {
    x: number;
    y: number;
  };
  userId: number;
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
  return (room as GameRoomStateObject).players !== undefined;
}

export interface GameRoomStateObject extends RoomStateObject {
  players: { [key: string]: Player };
}
