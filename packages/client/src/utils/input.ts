export function keyToCommand(key: string): string | undefined {
  switch (key) {
    case "ArrowUp":
    case "W":
    case "w":
      return "up";
    case "ArrowDown":
      case "S":
      case "s":
      return "down";
    case "ArrowRight":
      case "D":
      case "d":
      return "right";
    case "ArrowLeft":
      case "A":
      case "a":
      return "left";
    case " ":
      return "jump";
    default:
      return; // ignore other keys
  }
}
