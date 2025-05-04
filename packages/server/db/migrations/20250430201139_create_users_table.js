/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function up(knex) {
  return knex.schema.createTable("users", (table) => {
    table.increments("id").primary();
    table.string("uuid").notNullable().unique().index();
    table.string("username").notNullable().unique();
    table.string("password").notNullable();
    table.string("email").notNullable().unique();
    table.string("verification_token").notNullable().unique();
    table
      .timestamp("verification_token_expires_at", { useTz: true })
      .notNullable()
      .index();
    table.boolean("verified").defaultTo(false);
    table.timestamps(true, true); // Automatically creates created_at and updated_at
  });
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export function down(knex) {
  return knex.schema.dropTableIfExists("users");
}
