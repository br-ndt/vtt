import { randomUUID } from "crypto";
import { BaseModel } from "./Base";

class User extends BaseModel {
  createdAt!: string;
  email!: string;
  id!: number;
  password!: string;
  updatedAt?: string;
  username!: string;
  uuid!: string;
  verificationToken!: string;
  verificationTokenExpiresAt!: Date;
  verified!: boolean;

  static get tableName() {
    return "users";
  }

  $beforeInsert() {
    const now = new Date();
    this.uuid = randomUUID();
    this.verificationToken = randomUUID();
    this.verificationTokenExpiresAt = new Date(
      now.getTime() + 1000 * 60 * 60 * 24
    );
  }
}

export default User;
