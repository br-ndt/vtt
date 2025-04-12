import { Canvas } from "@react-three/fiber";
import Player from "./Player";
import { useSocket } from "./SocketContext";
import { useAuth } from "./AuthContext";
import { useCallback, useState } from "react";
import GroundPlane from "./GroundPlane";
import BigLight from "./BigLight";
import { useGLTF } from "@react-three/drei";

function R3F() {
  const { user } = useAuth();
  const { gameState } = useSocket();
  const [keysToHover, setKeysToHover] = useState<number[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<{ [key: number]: boolean }>(
    {}
  );
  const playerGltf = useGLTF("/Mech_FinnTheFrog.glb");

  const onHover = useCallback(
    (key: number, value: boolean) => {
      if (key.toString() == user?.id) {
        return;
      }
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
    (key: number) => {
      if (key.toString() == user?.id) {
        return;
      }
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
      <Player
        color={player.userId.toString() == user?.id ? "blue" : "orange"}
        gltf={playerGltf}
        hovered={keysToHover.includes(player.userId)}
        isMoving={
          (player.velocity.x !== 0 && player.velocity.y !== 0) ||
          player.velocity.z !== 0
        }
        isPlayer={player.userId.toString() == user?.id}
        key={player.userId}
        name={player.username}
        onClick={(event) => {
          event.stopPropagation();
          onClick(player.userId);
        }}
        onHoverChange={(value) => onHover(player.userId, value)}
        position={[player.position.x, player.position.y, player.position.z]}
        rotation={[player.rotation.x, player.rotation.y, player.rotation.z]}
        selected={selectedKeys?.[player.userId] === true}
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
      <BigLight color="orange" intensity={0.5} position={[-50, 60, -33]} />
      <BigLight color="white" intensity={2} position={[-50, 60, 50]} />
      <BigLight color="blue" intensity={0.3} position={[18, 60, 50]} />
      {players}
      <GroundPlane height={100} width={100} />
    </Canvas>
  );
}

export default R3F;
