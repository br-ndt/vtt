import { Html, PerspectiveCamera } from "@react-three/drei";
import { Clock, ColorRepresentation, LoopOnce, Object3D } from "three";

import { BaseMeshProps } from "./BaseMesh";
import { RefObject, useEffect, useMemo, useRef } from "react";
import { ObjectMap, useFrame } from "@react-three/fiber";
import { GLTF } from "three-stdlib";
import { cloneGltfWithAnimations } from "./utils/gltf";
import { isMesh } from "./utils/mesh";

interface PlayerProps
  extends Pick<BaseMeshProps, "onClick" | "position" | "rotation"> {
  cameraPitch?: number;
  color?: ColorRepresentation;
  gltf: GLTF & ObjectMap;
  hovered?: boolean;
  id: number;
  isDead?: boolean;
  isMoving?: boolean;
  isPlayer?: boolean;
  name: string;
  onHoverChange?: (value: boolean) => void;
  ref?: RefObject<Object3D | null>;
  selected?: boolean;
  wireframe?: boolean;
}

function Player({
  cameraPitch = 0,
  color,
  gltf,
  isDead = false,
  isMoving = false,
  isPlayer,
  name,
  onHoverChange,
  position,
  ref,
  rotation,
}: PlayerProps) {
  const clock = useRef(new Clock());
  const { clone, mixer } = useMemo(() => {
    const result = cloneGltfWithAnimations(gltf, color);
    return result;
  }, [color, gltf]);

  useEffect(() => {
    clone.traverse((child) => {
      if (isMesh(child)) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [clone]);

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

  return (
    <group
      onPointerEnter={() => !isPlayer && onHoverChange?.(true)}
      onPointerLeave={() => !isPlayer && onHoverChange?.(false)}
      position={position}
      ref={ref}
      rotation={rotation}
      scale={0.5}
    >
      {isPlayer && (
        <PerspectiveCamera
          makeDefault
          position={[0, 5, -10]}
          rotation={[cameraPitch, Math.PI, 0]}
        />
      )}
      {clone && (
        <primitive
          castShadow
          object={clone}
          position={[0, 0, 0]}
          scale={[1, 1, 1]}
        />
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
