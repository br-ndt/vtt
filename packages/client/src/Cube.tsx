import { Color, ColorRepresentation } from "three";
import { BaseMeshProps } from "./BaseMesh";
import OutlineableMesh from "./OutlineableMesh";
import { useMemo } from "react";
import { OutlinesProps, PerspectiveCamera } from "@react-three/drei";

interface CubeProps
  extends Pick<BaseMeshProps, "onClick" | "position" | "rotation"> {
  color?: ColorRepresentation;
  hovered?: boolean;
  isPlayer?: boolean;
  onHoverChange?: (value: boolean) => void;
  selected?: boolean;
  wireframe?: boolean;
}

function Cube({
  color = "orange",
  hovered = false,
  isPlayer,
  onHoverChange,
  selected = false,
  wireframe,
  ...props
}: CubeProps) {
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

  return (
    <OutlineableMesh
      onPointerEnter={() => onHoverChange?.(true)}
      onPointerLeave={() => onHoverChange?.(false)}
      outlines={outlinesMemo}
      {...props}
    >
      {isPlayer && (
        <PerspectiveCamera
          makeDefault
          position={[0, 10, 20]}
          rotation={[Math.PI * 1.95, 0, 0]}
        />
      )}
      <pointLight intensity={80} position={[0, 1, 0]} />
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={finalColor} wireframe={wireframe} />
    </OutlineableMesh>
  );
}

export default Cube;
