use std::path::PathBuf;
use tauri::path::BaseDirectory;
use tauri::AppHandle;
use tauri::{self, Manager};

pub fn get_database_path(app: &AppHandle) -> PathBuf {
    let path = app
        .path()
        .resolve("database.db", BaseDirectory::AppConfig)
        .expect("Failed to resolve path");

    path
}
