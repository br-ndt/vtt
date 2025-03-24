import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { Player } from "./types";

interface Message {
  user: string;
  content: string;
}

function keyToCommand(key: string): string | undefined {
  switch (key) {
    case "ArrowUp":
      return "up";
    case "ArrowDown":
      return "down";
    case "ArrowRight":
      return "right";
    case "ArrowLeft":
      return "left";
    case " ":
      return "fire";
    default:
      return; // ignore other keys
  }
}

function Home() {
  const { user, logout } = useAuth();
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<Socket>();
  const [gameState, setGameState] = useState<{
    players: { [key: string]: Player };
  }>({ players: {} });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const thisSocket = io();
    setSocket(thisSocket);

    thisSocket.on("update", (gameState) => {
      setGameState(gameState);
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
      socket?.off("chat message");
      removeEventListener("keydown", onKeyDown);
      removeEventListener("keyup", onKeyUp);
    };
  }, [socket]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const id of Object.keys(gameState.players)) {
      ctx.save();
      ctx.translate(
        gameState.players[id].position.x,
        gameState.players[id].position.y
      );
      ctx.fillStyle = id === socket?.id ? "blue" : "red";
      ctx.fillRect(-4, -4, 8, 8);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      ctx.strokeRect(-4, -4, 8, 8);
      ctx.restore();
    }
  }, [gameState]);

  const sendMessage = () => {
    socket?.emit("message", message);
    setMessage("");
  };

  return (
    <div>
      <h1>Welcome, {user?.username}!</h1>
      <div style={{ display: "flex" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-end",
          }}
        >
          <div>
            {messages.map((message, i) => (
              <p
                style={{ display: "flex", justifyContent: "flex-start" }}
                key={`${message.user}-${i}`}
              >
                <strong
                  style={{
                    color: message.user === socket?.id ? "yellow" : "",
                  }}
                >
                  {message.user}:
                </strong>
                &nbsp;
                {message.content}
              </p>
            ))}
          </div>
          <div style={{ display: "flex" }}>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message"
            />
            <button onClick={sendMessage}>Send Message</button>
          </div>
        </div>

        <canvas
          ref={canvasRef}
          width={500}
          height={500}
          style={{ border: "1px solid black" }}
        />
      </div>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default Home;
