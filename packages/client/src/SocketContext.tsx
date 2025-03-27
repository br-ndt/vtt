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
import { Player, RoomInfo } from "./types";

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
    players: { [key: string]: Player };
  };
  getRooms: () => void;
  hover: (id: string, value: boolean) => void;
  messages: Message[];
  rooms: RoomInfo[];
  sendMessage: (message: string) => void;
}

const defaultSocketContext: SocketContextType = {
  activeRoom: "",
  changeRoom: () => undefined,
  createRoom: () => undefined,
  gameState: { players: {} },
  getRooms: () => undefined,
  hover: () => undefined,
  messages: [],
  rooms: [],
  sendMessage: () => undefined,
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
  const [messages, setMessages] = useState<Message[]>(
    defaultSocketContext.messages
  );
  const [rooms, setRooms] = useState<RoomInfo[]>(defaultSocketContext.rooms);
  const [gameState, setGameState] = useState<{
    players: { [key: string]: Player };
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

    thisSocket.on("message", (messages) => {
      setMessages(messages);
    });

    return () => {
      thisSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (!socket) {
        return;
      }
      const command = keyToCommand(e.key);
      if (command) {
        socket.emit("control", { command, value: true });
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (!socket) {
        return;
      }
      const command = keyToCommand(e.key);
      if (command) {
        socket.emit("control", { command, value: false });
      }
    }

    addEventListener("keydown", onKeyDown);
    addEventListener("keyup", onKeyUp);

    return () => {
      socket?.off("update");
      socket?.off("room");
      socket?.off("rooms");
      socket?.off("message");
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
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}
