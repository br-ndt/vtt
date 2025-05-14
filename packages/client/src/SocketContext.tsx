import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";
import { keyToCommand } from "./utils/input";
import { Bullet, Player, RoomInfo, Terrain, WorldObject } from "./types";

interface Message {
  user: string;
  content: string;
}

interface SocketContextProps {
  children: ReactNode | ReactNode[];
}

interface SocketContextType {
  activeRoom: string;
  changeRoom: (roomName: string) => void;
  createRoom: () => void;
  gameState: {
    objects: {
      bullets: Bullet[];
    };
    players: { [key: string]: Player };
    scores: { [key: string]: number };
  };
  getRooms: () => void;
  hover: (id: string, value: boolean) => void;
  messages: Message[];
  rooms: RoomInfo[];
  sendMessage: (message: string) => void;
  terrain: Terrain;
  updateFacing: (yaw: number, pitch: number) => void;
}

const defaultSocketContext: SocketContextType = {
  activeRoom: "",
  changeRoom: () => undefined,
  createRoom: () => undefined,
  gameState: { objects: { bullets: [] }, players: {}, scores: {} },
  getRooms: () => undefined,
  hover: () => undefined,
  messages: [],
  rooms: [],
  sendMessage: () => undefined,
  terrain: { indices: [], scenery: [], vertices: [] },
  updateFacing: () => undefined,
};

const SocketContext = createContext<SocketContextType | undefined>(
  defaultSocketContext
);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export function SocketProvider({ children }: SocketContextProps) {
  const [activeRoom, setActiveRoom] = useState<string>("");
  const [socket, setSocket] = useState<Socket>();
  const [terrain, setTerrain] = useState<{
    indices: number[];
    scenery: WorldObject[];
    vertices: number[]; // this should probably be done elsewhere / is a sign this context will get bloated
  }>(defaultSocketContext.terrain);
  const [messages, setMessages] = useState<Message[]>(
    defaultSocketContext.messages
  );
  const [rooms, setRooms] = useState<RoomInfo[]>(defaultSocketContext.rooms);
  const [gameState, setGameState] = useState<{
    objects: { bullets: Bullet[] };
    players: { [key: string]: Player };
    scores: { [key: string]: number };
  }>(defaultSocketContext.gameState);

  useEffect(() => {
    const thisSocket = io({ withCredentials: true });
    setSocket(thisSocket);

    thisSocket.on("update", (gameState) => {
      setGameState(gameState);
    });

    thisSocket.on("room", (room) => {
      setActiveRoom(room);
    });

    thisSocket.on("rooms", (rooms) => {
      setRooms(rooms);
    });

    thisSocket.on("terrain", (terrain) => {
      setTerrain(terrain);
    });

    thisSocket.on("message", (messages) => {
      setMessages(messages);
    });

    return () => {
      thisSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (!socket || activeRoom === "lobby") {
        return;
      }
      if (e.button === 0) {
        socket.emit("control", { command: "fire", value: true });
      }
    }
    function onMouseUp(e: MouseEvent) {
      if (!socket || activeRoom === "lobby") {
        return;
      }
      if (e.button === 0) {
        socket.emit("control", { command: "fire", value: false });
      }
    }

    function onKeyDown(e: KeyboardEvent) {
      if (!socket || activeRoom === "lobby") {
        return;
      }
      const command = keyToCommand(e.key);
      if (command) {
        socket.emit("control", { command, value: true });
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (!socket || activeRoom === "lobby") {
        return;
      }
      const command = keyToCommand(e.key);
      if (command) {
        socket.emit("control", { command, value: false });
      }
    }

    addEventListener("mousedown", onMouseDown);
    addEventListener("mouseup", onMouseUp);
    addEventListener("keydown", onKeyDown);
    addEventListener("keyup", onKeyUp);

    return () => {
      socket?.off("update");
      socket?.off("room");
      socket?.off("rooms");
      socket?.off("terrain");
      socket?.off("message");
      removeEventListener("mousedown", onMouseDown);
      removeEventListener("mouseup", onMouseUp);
      removeEventListener("keydown", onKeyDown);
      removeEventListener("keyup", onKeyUp);
    };
  }, [socket]);

  const getRooms = useCallback(() => {
    socket?.emit("getRooms");
  }, [socket]);

  const sendMessage = useCallback(
    (message: string) => {
      socket?.emit("message", message);
    },
    [socket]
  );

  const changeRoom = useCallback(
    (roomId: string) => {
      socket?.emit("changeRoom", roomId);
    },
    [socket]
  );

  const createRoom = useCallback(() => {
    socket?.emit("createRoom");
  }, [socket]);

  const hover = useCallback(
    (id: string, value: boolean) => {
      socket?.emit("hover", { id, value });
    },
    [socket]
  );

  const updateFacing = useCallback(
    (yaw: number, pitch: number) => {
      socket?.emit("control", { command: "facing", value: { pitch, yaw } });
    },
    [socket]
  );

  return (
    <SocketContext.Provider
      value={{
        activeRoom,
        changeRoom,
        createRoom,
        gameState,
        getRooms,
        hover,
        messages,
        rooms,
        sendMessage,
        terrain,
        updateFacing,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
