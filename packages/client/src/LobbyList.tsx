import { useEffect } from "react";
import { useSocket } from "./SocketContext";

function LobbyList() {
  const { changeRoom, getRooms, rooms } = useSocket();

  useEffect(() => {
    getRooms();
  }, [getRooms]);

  return (
    <div
      style={{
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        flexGrow: 1,
        gap: "12px",
        justifyContent: "flex-start",
        maxHeight: "60%",
        overflowY: "scroll",
        padding: "0 12px",
        width: "100%",
      }}
    >
      {rooms.map((room) => (
        <button
          style={{ width: "100%" }}
          onClick={() => {
            changeRoom(room.id);
          }}
        >
          <h3>{room.name}</h3>
          <p>{room.players}</p>
        </button>
      ))}
    </div>
  );
}

export default LobbyList;
