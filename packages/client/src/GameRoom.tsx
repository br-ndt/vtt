import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import ChatWindow from "./ChatWindow";
import R3F from "./R3F";

export function GameRoom() {
  const { logout, user } = useAuth();
  const { activeRoom, changeRoom, gameState } = useSocket();

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          display: "flex",
          height: "100vh",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        {/* <canvas
            ref={canvasRef}
            width={500}
            height={500}
            style={{ border: "1px solid black" }}
            /> */}
        <div
          style={{
            alignItems: "flex-start",
            display: "flex",
            flexDirection: "column",
            flexGrow: 1,
            padding: "4px",
            width: "30vw",
            zIndex: 1,
          }}
        >
          <h6 style={{ margin: "2px 0" }}>Room {activeRoom}</h6>
          <hr style={{ opacity: "30%", width: "100%" }} />
          {Object.keys(gameState.scores)
            .sort((a, b) => gameState.scores[b] - gameState.scores[a])
            .map((key) => (
              <p
                style={{
                  color: key === user?.username ? "yellow" : "white",
                  margin: "2px 0",
                }}
              >
                {key} {gameState.scores[key]}
              </p>
            ))}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            height: "40%",
            pointerEvents: "none",
            width: "100vw",
          }}
        >
          <ChatWindow />
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              style={{ marginTop: "auto", pointerEvents: "auto", zIndex: 1 }}
              onClick={() => changeRoom("lobby")}
            >
              Back to lobby
            </button>
            <button
              style={{ marginTop: "auto", pointerEvents: "auto", zIndex: 1 }}
              onClick={logout}
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      <R3F />
    </div>
  );
}
