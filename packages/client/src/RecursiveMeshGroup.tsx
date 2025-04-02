import { RefObject } from "react";
import { Bone, ColorRepresentation, Group, Mesh } from "three";

interface RecursiveMeshGroupProps {
  color?: ColorRepresentation;
  ref: RefObject<Group | Bone>;
}

export default function RecursiveMeshGroup({
  color = "white",
  ref,
}: RecursiveMeshGroupProps) {
  return (
    <>
      {ref?.current?.children.map((child) => {
        if (child instanceof Mesh) {
          return (
            <mesh
              geometry={child.geometry}
              key={child.name}
              name={child.name}
              position={child.position}
              rotation={child.rotation}
            >
              <meshStandardMaterial color={color} />
            </mesh>
          );
        } else if (child instanceof Bone) {
          return (
            <bone {...child} key={child.name}>
              <RecursiveMeshGroup
                color={color}
                ref={{ current: { ...child, isBone: true } as Bone }}
              />
            </bone>
          );
        } else if (child instanceof Group) {
          return (
            <RecursiveMeshGroup
              color={color}
              ref={{ current: child }}
              key={child.name}
            />
          );
        } else {
          return <></>;
        }
      })}
    </>
  );
}
