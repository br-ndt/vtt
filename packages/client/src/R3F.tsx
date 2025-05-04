import { useCallback, useEffect, useRef, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Object3D } from "three";

import { wrapAngle } from "./utils/math";

import { useAuth } from "./AuthContext";
import BigLight from "./BigLight";
import GroundPlane from "./GroundPlane";
import Player from "./Player";
import { useSocket } from "./SocketContext";

const CAMERA_SENSITIVITY = 0.001;

function R3F() {
  const { user } = useAuth();
  const { gameState, updateFacing } = useSocket();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pitch, setPitch] = useState(0);
  const [yaw, setYaw] = useState(0);
  const [keysToHover, setKeysToHover] = useState<number[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<{ [key: number]: boolean }>(
    {}
  );
  const playerGltf = useGLTF("/Mech_FinnTheFrog.glb");
  const currentPlayer = useRef<Object3D | null>(null);

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
        return newKeys;
      });
    },
    [setSelectedKeys]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // do it at the onset
    canvas.requestPointerLock();

    const handleClick = () => {
      // register relocking for after the user hits ESC
      canvas.requestPointerLock();
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (document.pointerLockElement === canvas) {
        const deltaX = event.movementX;
        const deltaY = event.movementY;

        setYaw((prevYaw) => wrapAngle(prevYaw - deltaX * CAMERA_SENSITIVITY));
        setPitch((prevPitch) =>
          Math.max(
            -Math.PI / 16,
            Math.min(Math.PI / 180, prevPitch + deltaY * CAMERA_SENSITIVITY)
          )
        );
      }
    };

    canvas.addEventListener("click", handleClick);
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      canvas.removeEventListener("click", handleClick);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    updateFacing?.(yaw, pitch);
  }, [pitch, updateFacing, yaw]);

  return (
    <Canvas
      ref={canvasRef ? canvasRef : undefined}
      shadows
      style={{
        background: "black",
        height: "100vh",
        position: "absolute",
        top: 0,
        width: "100vw",
      }}
    >
      <BigLight color="orange" intensity={0.5} position={[-50, 60, -33]} />
      <BigLight color="white" intensity={2} position={[-50, 60, 50]} />
      <BigLight color="blue" intensity={0.3} position={[18, 60, 50]} />
      {Object.keys(gameState.players).map((key) => {
        const player = gameState.players[key];
        return (
          <Player
            cameraPitch={pitch}
            color={
              player.state === "dead"
                ? "black"
                : player.state === "damaged"
                ? "red"
                : player.userId.toString() == user?.id
                ? undefined
                : "orange"
            }
            gltf={playerGltf}
            hovered={keysToHover.includes(player.userId)}
            id={player.userId}
            isDead={player.state === "dead"}
            isMoving={
              (player.velocity.x !== 0 && player.velocity.y !== 0) ||
              player.velocity.z !== 0
            }
            isPlayer={player.userId.toString() == user?.uuid}
            key={player.userId}
            name={player.username}
            onClick={(event) => {
              event.stopPropagation();
              onClick(player.userId);
            }}
            onHoverChange={(value) => onHover(player.userId, value)}
            position={[player.position.x, player.position.y, player.position.z]}
            ref={currentPlayer}
            rotation={[
              player.rotation.x,
              player.userId.toString() == user?.uuid ? yaw : player.rotation.y,
              player.rotation.z,
            ]}
            selected={selectedKeys?.[player.userId] === true}
            wireframe={player.selected}
          />
        );
      })}
      {gameState.objects.bullets.map((bullet, i) => {
        return (
          <mesh
            key={`bullet_${bullet.playerId}_${i}`}
            position={[bullet.position.x, bullet.position.y, bullet.position.z]}
            rotation={[bullet.rotation.x, bullet.rotation.y, bullet.rotation.z]}
          >
            <meshStandardMaterial color="red" />
            <boxGeometry args={[0.1, 0.1, 0.2]} />
          </mesh>
        );
      })}
      <GroundPlane height={100} width={100} />
    </Canvas>
  );
}

export default R3F;
