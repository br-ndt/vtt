export interface Player {
  health: number;
  lastHitBy: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
  selected: boolean;
  state: PlayerState;
  userId: number;
  username: string;
  velocity: {
    x: number;
    y: number;
    z: number;
  };
}

export interface Bullet {
  playerId: number;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
    z: number;
  };
}

export interface WorldObject {
  type: "tree" | "rock";
  position: [number, number, number];
  rotation: [number, number, number];
}

export interface RoomInfo {
  id: string;
  name: string;
  players: string;
}

export interface Terrain {
  indices: number[];
  scenery: WorldObject[];
  vertices: number[];
}

enum PlayerState {
  NORMAL = "normal",
  DAMAGED = "damaged",
  DEAD = "dead",
}
