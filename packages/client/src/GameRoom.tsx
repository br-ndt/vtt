import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import ChatWindow from "./ChatWindow";
import R3F from "./R3F";

export function GameRoom() {
  const { logout } = useAuth();
  const { activeRoom, changeRoom } = useSocket();

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
        <h6 style={{ padding: "4px 8px", zIndex: 1 }}>{activeRoom}</h6>
      </div>
      <R3F />
    </div>
  );
}
