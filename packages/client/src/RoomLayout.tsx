import { GameRoom } from "./GameRoom";
import Lobby from "./Lobby";
import { useSocket } from "./SocketContext";

function AuthLayout() {
  const { activeRoom } = useSocket();

  return activeRoom === "lobby" || activeRoom === "" ? <Lobby /> : <GameRoom />;
}

export default AuthLayout;
