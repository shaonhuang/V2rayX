// src/migrations.rs

use tauri_plugin_sql::{Migration, MigrationKind};

pub fn get_migrations() -> Vec<Migration> {
    vec![Migration {
        version: 1,
        description: "create_initial_tables",
        sql: include_str!("../sql/create_initial_tables.sql"),
        kind: MigrationKind::Up,
    }]
}
