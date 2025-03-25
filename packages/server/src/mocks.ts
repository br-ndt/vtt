import bcrypt from "bcryptjs";

export function generateMockUser(
  username: string,
  curId: number
): Express.User & { password: string } {
  const password = bcrypt.hashSync("bar", 10);
  return {
    activeRoom: "lobby",
    id: curId,
    username,
    password,
  };
}
