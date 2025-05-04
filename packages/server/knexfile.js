// NOTE(tbrandt): this file is used to configure CLI commands
import { configDotenv } from "dotenv";
import { knexSnakeCaseMappers } from "objection";

configDotenv();

export default {
  development: {
    client: "pg",
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_DEFAULT,
    },
    migrations: {
      directory: "./db/migrations",
    },
    ...knexSnakeCaseMappers(),
  },
};
