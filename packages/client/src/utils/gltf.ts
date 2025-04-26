import { ObjectMap } from "@react-three/fiber";
import {
  AnimationMixer,
  ColorRepresentation,
  MeshStandardMaterial,
} from "three";
import { GLTF, SkeletonUtils } from "three-stdlib";
import { isMesh } from "./mesh";

export function cloneGltfWithAnimations(
  gltf: GLTF & ObjectMap,
  color?: ColorRepresentation
) {
  const clone = SkeletonUtils.clone(gltf.scene.children[0]);
  const mixer = new AnimationMixer(clone);
  const material = new MeshStandardMaterial({ color });

  clone.traverse((child) => {
    if (isMesh(child) && color) {
      child.material = material;
    }
  });

  return { clone, mixer };
}
