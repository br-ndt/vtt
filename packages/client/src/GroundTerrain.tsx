import { useMemo } from "react";
import { Terrain } from "./types";
import { BufferAttribute, BufferGeometry } from "three";
import { Scenery } from "./Scenery";

export default function GroundTerrain({ terrain }: { terrain: Terrain }) {
  const geometry = useMemo(() => {
    const geo = new BufferGeometry();
    geo.setAttribute(
      "position",
      new BufferAttribute(new Float32Array(terrain.vertices), 3)
    );
    geo.setIndex(terrain.indices);
    geo.computeVertexNormals(); // Important for lighting
    return geo;
  }, [terrain]);
  return (
    <group>
      <mesh castShadow geometry={geometry} receiveShadow>
        <meshStandardMaterial />
      </mesh>
      <Scenery objects={terrain.scenery} />
    </group>
  );
}
