import { useEffect, useState } from "react";
import { useAuth } from "./AuthContext";
import { useSocket } from "./SocketContext";

function Lobby() {
  const { user, logout } = useAuth();
  const { changeRoom, createRoom, getRooms, messages, rooms, sendMessage } =
    useSocket();
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    getRooms();
  }, [getRooms]);

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
      </div>
      <div>
        <div>
          {rooms.map((room) => (
            <div
              style={{ border: "1px solid white", cursor: "pointer" }}
              onClick={() => {
                changeRoom(room.id);
              }}
            >
              <h3>{room.name}</h3>
              <p>{room.players}</p>
            </div>
          ))}
        </div>
        <button onClick={createRoom}>Create Room +</button>
      </div>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

export default Lobby;
