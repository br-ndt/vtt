import { Html, PerspectiveCamera } from "@react-three/drei";
import { AnimationMixer, Clock, ColorRepresentation, Euler } from "three";

import { BaseMeshProps } from "./BaseMesh";
import { useEffect, useMemo, useRef } from "react";
import { ObjectMap, useFrame } from "@react-three/fiber";
import AnimatedGLTFInstance from "./AnimatedGLTFInstance";
import { GLTF } from "three-stdlib";
import { cloneGltfWithAnimations } from "./utils/gltf";

interface PlayerProps
  extends Pick<BaseMeshProps, "onClick" | "position" | "rotation"> {
  color?: ColorRepresentation;
  gltf: GLTF & ObjectMap;
  hovered?: boolean;
  isMoving?: boolean;
  isPlayer?: boolean;
  name: string;
  onHoverChange?: (value: boolean) => void;
  selected?: boolean;
  wireframe?: boolean;
}

function Player({
  color,
  gltf,
  isMoving = false,
  isPlayer,
  name,
  position,
  rotation,
}: PlayerProps) {
  const clock = useRef(new Clock());
  const { clone, mixer } = useMemo(() => cloneGltfWithAnimations(gltf), [gltf]);

  useEffect(() => {
    mixer.stopAllAction();
    if (isMoving) {
      mixer.clipAction(gltf.animations[12]).play(); // WALK
    } else {
      mixer.clipAction(gltf.animations[0]).play(); // IDLE
    }
  }, [gltf, isMoving, mixer]);

  useFrame(() => {
    mixer.update(clock.current.getDelta());
  });

  if (rotation instanceof Euler) {
    rotation.y += Math.PI / 2;
  }

  return (
    <group position={position} rotation={rotation} scale={0.5}>
      <axesHelper />
      {isPlayer && (
        <PerspectiveCamera
          makeDefault
          position={[0, 4, -10]}
          rotation={[0, Math.PI, 0]}
        />
      )}
      {clone && (
        <primitive object={clone} position={[0, 0, 0]} scale={[1, 1, 1]} />
      )}
      {!isPlayer && (
        <Html>
          <p>{name}</p>
        </Html>
      )}
    </group>
  );
}

export default Player;
