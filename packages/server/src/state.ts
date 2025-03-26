import { generateMockUser } from "./mocks";

export function setupServerState(curId: number) {
  return {
    accounts: [
      generateMockUser("foo", ++curId),
      generateMockUser("baz", ++curId),
    ],
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
