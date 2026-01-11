// src/migrations.rs

use tauri_plugin_sql::{Migration, MigrationKind};

// Combine the SQL contents at compile time to create a static string
const MIGRATION_2_SQL: &str = concat!(
    include_str!("../sql/create_subscriptions_table_etc.sql"),
    "\n", 
    include_str!("../sql/delete_all_data.sql")
);

pub fn get_migrations() -> Vec<Migration> {
    vec![
    Migration {
        version: 1,
        description: "create_initial_tables",
        sql: include_str!("../sql/create_initial_tables.sql"),
        kind: MigrationKind::Up,
    },
    Migration {
        version: 2,
        description: "create subscriptions table and add salt field in user table",
        sql: MIGRATION_2_SQL,
        kind: MigrationKind::Up,
    }]
}
