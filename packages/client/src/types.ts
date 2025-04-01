export interface Player {
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
  userId: number;
  username: string;
  velocity: {
    x: number;
    y: number;
    z: number;
  };
}

export interface RoomInfo {
  id: string;
  name: string;
  players: string;
}
