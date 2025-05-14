import { WorldObject } from "./types";

type SceneryProps = {
  objects: WorldObject[];
};

export function Scenery({ objects, ...props }: SceneryProps) {
  return (
    <group {...props}>
      {objects?.map((obj, i) => {
        const [x, y, z] = obj.position;

        if (obj.type === "tree") {
          return (
            <group key={i} position={[x, y, z]} castShadow receiveShadow>
              <mesh position={[0, 0.75, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 1.5, 8]} />
                <meshStandardMaterial color="#8B5A2B" />
              </mesh>
              <mesh position={[0, 6, 0]} castShadow>
                <coneGeometry args={[2, 10, 8]} />
                <meshStandardMaterial color="forestgreen" />
              </mesh>
            </group>
          );
        }

        if (obj.type === "rock") {
          return (
            <mesh key={i} position={[x, y - 0.1, z]} receiveShadow>
              <dodecahedronGeometry args={[0.3, 0]} />
              <meshStandardMaterial color="slategray" />
            </mesh>
          );
        }

        return null;
      })}
    </group>
  );
}
