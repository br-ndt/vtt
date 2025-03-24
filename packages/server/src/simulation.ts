import { Player } from "./types";

export function stepPlayer(player: Player, dt: number): Player {
  let vy = 0;
  let vx = 0;
  const speed = 100;
  if (player.commands.down) {
    if (!player.commands.up) {
      vy = 1;
    }
  } else if (player.commands.up) {
    vy = -1;
  }
  if (player.commands.right) {
    if (!player.commands.left) {
      vx = 1;
    }
  } else if (player.commands.left) {
    vx = -1;
  }
  if (vx !== 0 && vy !== 0) {
    const magnitude = Math.sqrt(vx * vx + vy * vy);
    vx /= magnitude;
    vy /= magnitude;
  }
  vx *= speed * dt;
  vy *= speed * dt;

  player.position.x += vx;
  player.position.y += vy;

  return player;
}
