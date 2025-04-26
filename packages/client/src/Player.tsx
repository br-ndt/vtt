import { Html, PerspectiveCamera } from "@react-three/drei";
import {
  Clock,
  ColorRepresentation,
  Euler,
  LoopOnce,
  Object3D,
  Object3DEventMap,
} from "three";

import { BaseMeshProps } from "./BaseMesh";
import { useEffect, useMemo, useRef } from "react";
import { ObjectMap, useFrame } from "@react-three/fiber";
import { GLTF } from "three-stdlib";
import { cloneGltfWithAnimations } from "./utils/gltf";

interface PlayerProps
  extends Pick<BaseMeshProps, "onClick" | "position" | "rotation"> {
  color?: ColorRepresentation;
  gltf: GLTF & ObjectMap;
  hovered?: boolean;
  id: number;
  isDead?: boolean;
  isMoving?: boolean;
  isPlayer?: boolean;
  name: string;
  onHoverChange?: (value: boolean) => void;
  ref?: (instance: Object3D<Object3DEventMap> | null) => void;
  selected?: boolean;
  wireframe?: boolean;
}

function Player({
  color,
  gltf,
  isDead = false,
  isMoving = false,
  isPlayer,
  name,
  onHoverChange,
  position,
  rotation,
}: PlayerProps) {
  const clock = useRef(new Clock());
  const { clone, mixer } = useMemo(() => {
    const result = cloneGltfWithAnimations(gltf, color);
    return result;
  }, [color, gltf]);

  useEffect(() => {
    mixer.stopAllAction();
    if (isDead) {
      const action = mixer.clipAction(gltf.animations[1]); // DEAD
      action.setLoop(LoopOnce, 1);
      action.clampWhenFinished = true;
      action.play();
    } else if (isMoving) {
      mixer.clipAction(gltf.animations[12]).play(); // WALK
    } else {
      mixer.clipAction(gltf.animations[0]).play(); // IDLE
    }
  }, [gltf, isDead, isMoving, mixer]);

  useFrame(() => {
    mixer.update(clock.current.getDelta());
  });

  if (rotation instanceof Euler) {
    rotation.y += Math.PI / 2;
  }

  return (
    <group
      onPointerEnter={() => !isPlayer && onHoverChange?.(true)}
      onPointerLeave={() => !isPlayer && onHoverChange?.(false)}
      position={position}
      rotation={rotation}
      scale={0.5}
    >
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
