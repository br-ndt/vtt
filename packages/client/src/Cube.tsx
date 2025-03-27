import { Color, ColorRepresentation } from "three";
import BaseMesh, { BaseMeshProps } from "./BaseMesh";

interface CubeProps extends Pick<BaseMeshProps, "position" | "rotation"> {
  color?:
    | string
    | number
    | Color
    | [r: number, g: number, b: number]
    | [color: ColorRepresentation]
    | Readonly<Color>
    | readonly [r: number, g: number, b: number]
    | undefined;
  onHoverChange?: (value: boolean) => void;
  wireframe?: boolean;
}

function Cube({
  color = "orange",
  onHoverChange,
  position,
  rotation,
  wireframe,
}: CubeProps) {
  return (
    <BaseMesh
      onPointerEnter={() => onHoverChange?.(true)}
      onPointerLeave={() => onHoverChange?.(false)}
      position={position}
      rotation={rotation}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} wireframe={wireframe} />
    </BaseMesh>
  );
}

export default Cube;
