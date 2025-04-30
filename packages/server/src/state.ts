export function setupServerState() {
  return {
    connected: [],
    rooms: {
      lobby: {
        id: "lobby",
        messages: [],
        name: "Lobby",
        users: [],
      },
    },
  };
}
