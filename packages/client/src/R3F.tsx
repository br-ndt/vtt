import { Canvas } from "@react-three/fiber";
import Cube from "./Cube";
import { OrbitControls } from "@react-three/drei";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";

function R3F() {
  const { user } = useAuth();
  const { gameState, hover } = useSocket();

  const players = Object.keys(gameState.players).map((key) => {
    const player = gameState.players[key];
    return (
      <Cube
        color={key == user?.id ? "blue" : "orange"}
        key={key}
        onHoverChange={(value) => hover(key, value)}
        position={[player.position.x, 0, -player.position.y]}
        rotation={[player.rotation.x, 0, player.rotation.y]}
        wireframe={player.selected}
      />
    );
  });

  return (
    <Canvas
      shadows
      style={{
        background: "black",
        height: "100vh",
        position: "absolute",
        top: 0,
        width: "100vw",
      }}
    >
      <axesHelper />
      <ambientLight />
      <pointLight position={[1, 1, 4]} />
      {players}
      <OrbitControls />
    </Canvas>
  );
}

export default R3F;
