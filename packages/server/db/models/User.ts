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
  verified!: boolean;
  
  static get tableName() {
    return "users";
  }
}

export default User;
