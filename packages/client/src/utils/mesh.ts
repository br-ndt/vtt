import { Mesh, Object3D } from "three";

export function isMesh(child: Object3D): child is Mesh {
  return child.type === "SkinnedMesh" || child.type === "Mesh";
}
