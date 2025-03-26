import { useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";

export function GameRoom() {
  const { logout, user } = useAuth();
  const { activeRoom, changeRoom, gameState, messages, sendMessage } =
    useSocket();
  const [message, setMessage] = useState<string>("");

  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      ctx.fillStyle = id == user?.id ? "blue" : "red";
      ctx.fillRect(-4, -4, 8, 8);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
      ctx.strokeRect(-4, -4, 8, 8);
      ctx.restore();
    }
  }, [gameState]);

  return (
    <div>
      <h2>{activeRoom}</h2>
      <div>
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
                      color: message.user === user?.username ? "yellow" : "",
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
              <button
                onClick={() => {
                  setMessage("");
                  sendMessage(message);
                }}
              >
                Send Message
              </button>
            </div>
          </div>

          <canvas
            ref={canvasRef}
            width={500}
            height={500}
            style={{ border: "1px solid black" }}
          />
        </div>
      </div>
      <button onClick={() => changeRoom("lobby")}>Back to Lobby</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
