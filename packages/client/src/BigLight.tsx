import { ColorRepresentation, Vector3 } from "three";

interface BigLightProps {
  color: ColorRepresentation;
  intensity: number;
  position: Vector3 | [r: number, g: number, b: number];
}

export default function BigLight({
  color,
  intensity,
  position,
}: BigLightProps) {
  return (
    <directionalLight
      castShadow
      color={color}
      intensity={intensity}
      position={position}
      shadow-mapSize-width={4096}
      shadow-mapSize-height={4096}
      shadow-camera-left={-75}
      shadow-camera-right={75}
      shadow-camera-top={75}
      shadow-camera-bottom={-75}
    />
  );
}
