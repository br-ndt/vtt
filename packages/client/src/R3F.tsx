import { Canvas } from "@react-three/fiber";
import Cube from "./Cube";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";
import { useCallback, useState } from "react";
import GroundPlane from "./GroundPlane";

function R3F() {
  const { user } = useAuth();
  const { gameState } = useSocket();
  const [keysToHover, setKeysToHover] = useState<string[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<{ [key: string]: boolean }>(
    {}
  );

  const onHover = useCallback(
    (key: string, value: boolean) => {
      setKeysToHover((prevKeys) => {
        if (value) {
          return [...prevKeys, key];
        } else if (prevKeys.includes(key)) {
          return prevKeys.filter((prevKey) => prevKey !== key);
        }
        return prevKeys;
      });
    },
    [setKeysToHover]
  );

  const onClick = useCallback(
    (key: string) => {
      setSelectedKeys((prevKeys) => {
        const newKeys = { ...prevKeys };
        const prevVal = prevKeys[key as keyof typeof prevKeys];
        if (prevVal !== undefined) {
          newKeys[key] = !prevVal;
        } else {
          newKeys[key] = true;
        }
        console.log("newKeys", newKeys);
        return newKeys;
      });
    },
    [setSelectedKeys]
  );

  const players = Object.keys(gameState.players).map((key) => {
    const player = gameState.players[key];
    return (
      <Cube
        color={key == user?.id ? "blue" : "orange"}
        hovered={keysToHover.includes(key)}
        isPlayer={key == user?.id}
        key={key}
        onClick={(event) => {
          event.stopPropagation();
          onClick(key);
        }}
        onHoverChange={(value) => onHover(key, value)}
        position={[player.position.x, player.position.y, player.position.z]}
        rotation={[player.rotation.x, player.rotation.y, player.rotation.z]}
        selected={selectedKeys?.[key] === true}
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
      <pointLight castShadow intensity={8} position={[1, 1, 4]} />
      {players}
      <GroundPlane height={100} width={100} />
    </Canvas>
  );
}

export default R3F;
