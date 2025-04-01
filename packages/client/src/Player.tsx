import {
  Html,
  OutlinesProps,
  PerspectiveCamera,
  useFBX,
} from "@react-three/drei";
import {
  AnimationMixer,
  Color,
  ColorRepresentation,
  Group,
  LoopRepeat,
  Mesh,
  Object3D,
} from "three";

import BaseMesh, { BaseMeshProps } from "./BaseMesh";
import { ReactNode, useCallback, useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import OutlineableMesh from "./OutlineableMesh";

interface PlayerProps
  extends Pick<BaseMeshProps, "onClick" | "position" | "rotation"> {
  color?: ColorRepresentation;
  hovered?: boolean;
  isMoving?: boolean;
  isPlayer?: boolean;
  name: string;
  onHoverChange?: (value: boolean) => void;
  selected?: boolean;
  wireframe?: boolean;
}

function Player({
  color = "orange",
  hovered = false,
  isMoving = false,
  isPlayer,
  name,
  onHoverChange,
  position,
  rotation,
  selected = false,
  wireframe,
  ...props
}: PlayerProps) {
  const fbx = useFBX("/Mech_FinnTheFrog.fbx");
  const group = useRef<Group | null>(null);
  const mixer = useRef<AnimationMixer | null>(null);
  const outlinesMemo = useMemo<OutlinesProps[]>(() => {
    const retVal: OutlinesProps[] = [];
    if (selected) {
      retVal.push({ color: "yellow", thickness: 3 });
      if (hovered) {
        retVal.push({ color: "white", thickness: 5 });
      }
    } else if (hovered) {
      retVal.push({ color: "white", thickness: 2 });
    }

    return retVal;
  }, [hovered, selected]);

  const finalColor = useMemo<Color>(() => {
    const base = new Color(color);
    const lightened = new Color().lerpColors(base, new Color("white"), 0.15);
    return hovered ? lightened : base;
  }, [color, hovered]);

  const meshes = useMemo<ReactNode[] | undefined>(() => {
    const retVal: ReactNode[] = [];
    fbx.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        retVal.push(
          <BaseMesh
            geometry={child.geometry}
            material={child.material}
            position={[child.position.x, child.position.y, child.position.z]}
            rotation={[-Math.PI / 2, 0, Math.PI]}
          />
        );
      }
    });
    return retVal;
  }, [fbx]);

  const useFrameCallback = useCallback(() => {}, [mixer]);
  useFrame((_, delta) => {
    if (mixer.current) {
      mixer.current.update(delta);
    }
  });

  useEffect(() => {
    fbx &&
      fbx.traverse((child) => {
        console.log(child);
      });
  }, [fbx]);

  useEffect(() => {
    if (!fbx) {
      return;
    }
    if (mixer.current) {
      let action = mixer.current.clipAction(fbx.animations[4]);
      if (isMoving) {
        action = mixer.current.clipAction(fbx.animations[10]); // WALK
      }
      action.setLoop(LoopRepeat, Infinity);
      action.play();
    } else if (fbx.animations.length > 0) {
      mixer.current = new AnimationMixer(fbx);
      const action = mixer.current.clipAction(fbx.animations[4]); // IDLE
      action.setLoop(LoopRepeat, Infinity);
      action.play();
      group?.current?.mixer = mixer;
    }

    return () => {
      mixer.current?.stopAllAction();
    };
  }, [fbx, isMoving]);

  return (
    <group position={position} ref={group} rotation={rotation}>
      {meshes}
      {/* <OutlineableMesh
        geometry={mesh?.geometry}
        material={mesh?.material}
        onPointerEnter={() => onHoverChange?.(true)}
        onPointerLeave={() => onHoverChange?.(false)}
        outlines={outlinesMemo}
        position={position}
        rotation={[-Math.PI / 2, 0, Math.PI]}
        useFrameCallback={useFrameCallback}
        {...props}
      >
        {!mesh?.material && (
          <meshStandardMaterial color={finalColor} wireframe={wireframe} />
        )}
      </OutlineableMesh> */}
      {isPlayer && (
        <PerspectiveCamera
          makeDefault
          position={[0, 4, 7]}
          rotation={[Math.PI * 1.9, 0, 0]}
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
