import { ObjectMap } from "@react-three/fiber";
import { AnimationMixer } from "three";
import { GLTF, SkeletonUtils } from "three-stdlib";

export function cloneGltfWithAnimations(gltf: GLTF & ObjectMap) {
  const clone = SkeletonUtils.clone(gltf.scene.children[0]);

  const mixer = new AnimationMixer(clone);

  return { clone, mixer };
}
