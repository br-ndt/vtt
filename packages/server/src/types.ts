export interface Player {
  commands: {
    left?: boolean;
    right?: boolean;
    up?: boolean;
    down?: boolean;
  };
  position: {
    x: number;
    y: number;
  };
}

export interface User {
  username: string;
  password: string;
}

export interface StateObject {
  messages: { user: string; content: string }[];
  players: { [key: string]: Player };
  users: User[];
}
