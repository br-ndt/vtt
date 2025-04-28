import { generateMockUser } from "./mocks";

export function setupServerState() {
  return {
    accounts: [],
    rooms: {
      lobby: {
        id: "lobby",
        messages: [],
        name: "Lobby",
        users: [],
      },
    },
    users: [],
  };
}
