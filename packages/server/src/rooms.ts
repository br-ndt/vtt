import { randomUUID } from "crypto";
import {
  GameRoomStateObject,
  isGameRoomStateObject,
  RoomStateObject,
  UserState,
} from "./types";
import { Server, Socket } from "socket.io";
import { Command, controlHandler } from "./control";
import { createSimWorld, makeNewPlayer } from "./simulation";

export interface RoomDict {
  [key: string]: RoomStateObject;
}

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
    objects: {
      bullets: [],
    },
    pending: {
      bulletsToRemove: [],
      playersToHarm: [],
      playersToRemove: [],
    },
    players: {},
    scores: {},
    world: createSimWorld(),
  };
}

export function leaveRoom(
  socket: Socket,
  io: Server,
  user: UserState,
  room: RoomStateObject,
  roomDict: RoomDict
) {
  console.log(`${user?.username} leaving ${room?.name}`);

  if (isGameRoomStateObject(room)) {
    socket.off("control", (command: Command) => {
      controlHandler(user, roomDict, command);
    });

    socket.off("hover", ({ id, value }: { id: string; value: boolean }) => {
      hoverHandler(room, id, value);
    });
  }

  socket.leave(room?.id);
  room?.users?.splice(room.users.indexOf(user), 1);
  if (isGameRoomStateObject(room)) {
    for (const key of Object.keys(room.players[user.uuid].cooldowns)) {
      if (room.players[user.uuid].cooldowns[key]) {
        clearTimeout(room.players[user.uuid].cooldowns[key]);
      }
    }
    delete room.scores[user.uuid];
    delete room.players[user.uuid];
  }
  if (room.users.length <= 0 && room.id !== "lobby") {
    console.log(`deleting empty room ${room.name}`);
    delete roomDict[room.id];
    io.to("lobby").emit(
      "rooms",
      Object.keys(roomDict)
        .map((key) => {
          const room = roomDict[key];
          if (isGameRoomStateObject(room)) {
            return {
              id: room.id,
              name: room.name,
              players: `${Object.keys(room.players).length} / 16`,
            };
          }
        })
        .filter((room) => room !== undefined)
    );
  }
}

export function joinRoom(
  socket: Socket,
  user: UserState,
  nextRoom: RoomStateObject,
  roomDict: RoomDict
) {
  console.log(`${user.username} entering ${nextRoom.name}`);
  socket.join(nextRoom.id);
  user.activeRoom = nextRoom.id;
  nextRoom.users.push(user);
  if (isGameRoomStateObject(nextRoom)) {
    nextRoom.scores[user.uuid] = 0;
    nextRoom.players[user.uuid] = makeNewPlayer(user.uuid, user.username);
    nextRoom.world.addBody(nextRoom.players[user.uuid].physics);

    socket.on("control", (command: Command) => {
      controlHandler(user, roomDict, command);
    });

    socket.on("hover", ({ id, value }: { id: string; value: boolean }) => {
      hoverHandler(nextRoom, id, value);
    });
  }
  socket.emit("room", user.activeRoom);
  socket.emit("message", nextRoom.messages);
}

export function changeRoom(
  socket: Socket,
  io: Server,
  user: UserState,
  roomDict: RoomDict,
  nextRoom: RoomStateObject,
  prevRoom: RoomStateObject
) {
  leaveRoom(socket, io, user, prevRoom, roomDict);
  joinRoom(socket, user, nextRoom, roomDict);
}

export function changeRoomHandler(
  socket: Socket,
  io: Server,
  user: UserState,
  roomDict: RoomDict,
  roomId: string
) {
  const room = roomDict[roomId];
  if (room) {
    if (isGameRoomStateObject(room)) {
      if (Object.keys(room.players).length >= 16) {
        return;
      }
    }
    changeRoom(socket, io, user, roomDict, room, roomDict[user.activeRoom]);
  }
}

export function createRoomHandler(
  socket: Socket,
  io: Server,
  user: UserState,
  roomDict: { [key: string]: RoomStateObject }
) {
  const room = createGameRoom(`Cool Room #${Object.keys(roomDict).length}`);
  roomDict[room.id] = room;
  changeRoom(socket, io, user, roomDict, room, roomDict[user.activeRoom]);
  io.to("lobby").emit(
    "rooms",
    Object.keys(roomDict)
      .filter((key) => isGameRoomStateObject(roomDict[key]))
      .map((key) => {
        const room = roomDict[key] as GameRoomStateObject;
        return {
          id: room.id,
          name: room.name,
          players: `${Object.keys(room.players).length} / 16`,
        };
      })
  );
}

export function getRoomsHandler(
  socket: Socket,
  roomDict: { [key: string]: RoomStateObject }
) {
  socket.emit(
    "rooms",
    Object.keys(roomDict)
      .map((key) => {
        const room = roomDict[key];
        if (isGameRoomStateObject(room)) {
          return {
            id: room.id,
            name: room.name,
            players: `${Object.keys(room.players).length} / 16`,
          };
        }
      })
      .filter((room) => room !== undefined)
  );
}

function hoverHandler(room: GameRoomStateObject, id: string, value: boolean) {
  room.players[id].selected = value;
}
