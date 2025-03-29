import { randomUUID } from "crypto";
import {
  GameRoomStateObject,
  isGameRoomStateObject,
  RoomStateObject,
} from "./types";
import { Server, Socket } from "socket.io";
import { getRandomIntInclusive } from "./util";
import { MAX_HEIGHT, MAX_WIDTH } from "./constants";
import { Command, controlHandler } from "./control";

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
    players: {},
  };
}

export function leaveRoom(
  socket: Socket,
  io: Server,
  user: Express.User,
  room: RoomStateObject,
  roomDict: RoomDict
) {
  console.log(`${user.username} leaving ${room.name}`);

  if (isGameRoomStateObject(room)) {
    socket.off("control", (command: Command) => {
      controlHandler(user, room, command);
    });

    socket.off("hover", ({ id, value }: { id: string; value: boolean }) => {
      hoverHandler(room, id, value);
    });
  }

  socket.leave(room.id);
  room.users.splice(room.users.indexOf(user), 1);
  if (isGameRoomStateObject(room)) {
    delete room.players[user.id];
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
          console.log("oops");
        })
        .filter((room) => room !== undefined)
    );
  }
}

export function joinRoom(
  socket: Socket,
  user: Express.User,
  nextRoom: RoomStateObject
) {
  console.log(`${user.username} entering ${nextRoom.name}`);
  socket.join(nextRoom.id);
  user.activeRoom = nextRoom.id;
  nextRoom.users.push(user);
  if (isGameRoomStateObject(nextRoom)) {
    nextRoom.players[user.id] = {
      commands: {},
      isJumping: false,
      position: {
        x: getRandomIntInclusive(-MAX_WIDTH, MAX_WIDTH),
        y: 10,
        z: getRandomIntInclusive(-MAX_HEIGHT, MAX_HEIGHT),
      },
      rotation: {
        x: 0,
        y: 0,
        z: 0,
      },
      selected: false,
      userId: user.id,
      velocity: {
        x: 0,
        y: 0,
        z: 0,
      },
    };

    socket.on("control", (command: Command) => {
      controlHandler(user, nextRoom, command);
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
  user: Express.User,
  roomDict: RoomDict,
  nextRoom: RoomStateObject,
  prevRoom: RoomStateObject
) {
  leaveRoom(socket, io, user, prevRoom, roomDict);
  joinRoom(socket, user, nextRoom);
}

export function changeRoomHandler(
  socket: Socket,
  io: Server,
  user: Express.User,
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
  user: Express.User,
  roomDict: { [key: string]: RoomStateObject }
) {
  const room = createGameRoom(`Cool Room #${Object.keys(roomDict).length}`);
  roomDict[room.id] = room;
  changeRoom(socket, io, user, roomDict, room, roomDict[user.activeRoom]);
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
        console.log("oops");
      })
      .filter((room) => room !== undefined)
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
