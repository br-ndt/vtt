import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";
import LobbyList from "./LobbyList";
import ChatWindow from "./ChatWindow";

function Lobby() {
  const { logout } = useAuth();
  const { createRoom } = useSocket();

  return (
    <div
      style={{
        alignItems: "center",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      <LobbyList />
      <div
        style={{
          borderTop: "1px solid white",
          display: "flex",
          height: "40%",
          width: "100vw",
        }}
      >
        <ChatWindow />
        <div>
          <h1 style={{ padding: "4px 8px" }}>WONKGABE</h1>
          <button onClick={createRoom}>Create Room +</button>
          <button onClick={logout}>Logout</button>
        </div>
      </div>
    </div>
  );
}

export default Lobby;
