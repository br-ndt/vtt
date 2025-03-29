export default function GroundPlane({
  height = 10,
  width = 10,
}: {
  height?: number;
  width?: number;
}) {
  return (
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[width, height]} />
      <meshStandardMaterial />
    </mesh>
  );
}
