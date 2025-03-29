import BaseMesh, { BaseMeshProps } from "./BaseMesh";
import { Outlines, OutlinesProps } from "@react-three/drei";

interface OutlineableMeshProps extends BaseMeshProps {
  outlines: OutlinesProps[];
}

export default function OutlineableMesh({
  children,
  outlines,
  ...props
}: OutlineableMeshProps) {
  return (
    <BaseMesh {...props}>
      {children}
      {outlines.map((outline, i) => (
        <Outlines key={i} {...outline} />
      ))}
    </BaseMesh>
  );
}
