export function keyToCommand(key: string): string | undefined {
  switch (key) {
    case "ArrowUp":
      return "up";
    case "ArrowDown":
      return "down";
    case "ArrowRight":
      return "right";
    case "ArrowLeft":
      return "left";
    case " ":
      return "fire";
    default:
      return; // ignore other keys
  }
}
