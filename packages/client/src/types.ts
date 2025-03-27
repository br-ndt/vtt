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
}

export interface RoomInfo {
  id: string;
  name: string;
  players: string;
}
