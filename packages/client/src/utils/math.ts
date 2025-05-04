export function wrapAngle(angle: number): number {
  return ((angle + Math.PI) % (2 * Math.PI)) - Math.PI;
}
