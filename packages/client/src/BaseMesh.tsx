import { ThreeEvent } from "@react-three/fiber";
import { ReactNode, RefObject, useEffect, useRef } from "react";
import { BufferGeometry, Euler, EulerOrder, Material, Mesh } from "three";

export interface BaseMeshProps {
  children?: ReactNode | ReactNode[];
  disposeOnTeardown?: boolean;
  geometry?: BufferGeometry;
  material?: Material | Material[];
  onClick?: (event: ThreeEvent<globalThis.MouseEvent>) => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  position: [x: number, y: number, z: number];
  rotation?:
    | Euler
    | [x: number, y: number, z: number, order?: EulerOrder | undefined]
    | Readonly<
        | number
        | Euler
        | [x: number, y: number, z: number, order?: EulerOrder | undefined]
        | undefined
      >;
  useFrameCallback?: (ref: RefObject<Mesh<BufferGeometry> | null>) => void;
}

function BaseMesh({
  children,
  disposeOnTeardown,
  geometry,
  material,
  onClick,
  onPointerEnter,
  onPointerLeave,
  position,
  rotation,
  useFrameCallback,
}: BaseMeshProps) {
  const ref = useRef<Mesh<BufferGeometry> | null>(null);

  useEffect(() => {
    return () => {
      const mesh = ref.current;
      if (mesh) {
        if (mesh.geometry && disposeOnTeardown) mesh.geometry.dispose();
      }
    };
  }, []);

  useFrameCallback?.(ref);

  return (
    <mesh
      castShadow
      geometry={geometry}
      material={material}
      onClick={onClick}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      position={position}
      receiveShadow
      ref={ref}
      rotation={rotation}
    >
      {children}
    </mesh>
  );
}

export default BaseMesh;
