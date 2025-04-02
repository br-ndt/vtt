import { PerspectiveCamera } from "@react-three/drei";
import {
  AnimationMixer,
  ColorRepresentation,
  Euler,
  Group,
  LoopRepeat,
} from "three";

import { BaseMeshProps } from "./BaseMesh";
import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import RecursiveMeshGroup from "./RecursiveMeshGroup";

interface PlayerProps
  extends Pick<BaseMeshProps, "onClick" | "position" | "rotation"> {
  color?: ColorRepresentation;
  fbxSrc: Group;
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
  fbxSrc,
  isMoving = false,
  isPlayer,
  position,
  rotation,
}: PlayerProps) {
  const clone = useRef<Group>(fbxSrc.clone(true));
  const mixer = useRef<AnimationMixer | null>(null);
  if (rotation instanceof Euler) {
    rotation.y += Math.PI / 2;
  }

  useEffect(() => {
    if (!clone.current) {
      return;
    }
    if (mixer.current) {
      console.log(clone.current);
      let action = mixer.current.clipAction(clone.current.animations[4]); // IDLE
      if (isMoving) {
        action = mixer.current.clipAction(clone.current.animations[10]); // WALK
      }
      action.setLoop(LoopRepeat, Infinity);
      action.play();
    }

    return () => {
      mixer.current?.stopAllAction();
    };
  }, [clone, isMoving]);

  useFrame((_, delta) => {
    if (mixer.current) {
      mixer.current.update(delta);
    }
  });

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
      {clone.current && (
        <>
          <animationMixer args={[clone.current]} ref={mixer} />
          <RecursiveMeshGroup color={color} ref={clone} />
        </>
      )}
    </group>
  );
}

export default Player;
