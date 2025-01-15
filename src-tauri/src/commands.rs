use crate::proxy;
use crate::proxy::{unset_global_proxy, unset_pac_proxy};
use crate::utils;
use crate::v2ray_core;
use crate::v2ray_core::DaemonState;
use chrono::Local;
use log::{error, info};
use sqlx::sqlite::SqlitePoolOptions;
use sqlx::sqlite::SqliteRow;
use sqlx::Row;
use std::path::Path;
use std::process::Command;
use std::sync::{Arc, Mutex, RwLock};
use tauri::{
    // state is used in Linux
    self,
    AppHandle,
    Manager,
    State,
};

pub struct AppState {
    start_time: Arc<RwLock<chrono::DateTime<Local>>>,
}

impl AppState {
    pub fn new() -> Self {
        AppState {
            start_time: Arc::new(RwLock::new(Local::now())),
        }
    }
}

#[tauri::command]
pub fn get_elapsed_time(state: State<AppState>) -> Result<String, String> {
    let start = state.start_time.read().map_err(|e| e.to_string())?;
    let now = Local::now();
    let duration = now.signed_duration_since(*start);
    Ok(duration.num_seconds().to_string())
}

#[tauri::command]
pub async fn close_splashscreen(window: tauri::Window, user_id: String) {
    if let Some(splashscreen) = window.get_webview_window("splashscreen") {
        splashscreen.close().unwrap();
    }
    let database_path = utils::get_database_path(window.app_handle())
        .to_string_lossy()
        .to_string();

    if !Path::new(&database_path).exists() {
        error!("Database file does not exist at path: {}", database_path);
        let window = window.get_webview_window("main").unwrap();
        window.show().unwrap();
        window.set_focus().unwrap();
        return;
    }

    let database_url = format!("sqlite://{}", database_path);
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .map_err(|e| format!("Failed to connect to the database: {}", e))
        .unwrap();

    let dashboard_pop_when_start: i32 =
        sqlx::query("SELECT DashboardPopWhenStart FROM AppSettings WHERE UserID = ?")
            .bind(&user_id)
            .fetch_one(&pool)
            .await
            .map(|row: SqliteRow| row.get::<i32, _>("DashboardPopWhenStart"))
            .unwrap_or_else(|_| 1);

    if dashboard_pop_when_start == 1 {
        let window = window.get_webview_window("main").unwrap();
        window.show().unwrap();
        window.set_focus().unwrap();
    }
}

pub fn clear_v2ray_core_service() {
    // Define the process pattern based on the operating system
    #[cfg(target_os = "windows")]
    let process_pattern = "v2ray.exe run -c";

    #[cfg(not(target_os = "windows"))]
    let process_pattern = "v2ray run -c";

    // Execute the appropriate commands based on the OS
    #[cfg(target_os = "windows")]
    {
        // Windows-specific implementation
        // Use 'tasklist' to check if 'v2ray.exe' is running with the specific arguments
        // and 'taskkill' to terminate it.

        // First, check if the process is running
        let check_output = Command::new("tasklist")
            .args(&["/FI", &format!("IMAGENAME eq {}", "v2ray.exe")])
            .output();

        match check_output {
            Ok(output) => {
                let stdout = String::from_utf8_lossy(&output.stdout);
                if stdout.contains("v2ray.exe") {
                    // If the process is running, attempt to kill it
                    let kill_output = Command::new("taskkill")
                        .args(&["/IM", "v2ray.exe", "/F"])
                        .output();

                    match kill_output {
                        Ok(kill_result) => {
                            if kill_result.status.success() {
                                println!("v2ray service killed successfully.");
                            } else {
                                let error_message = String::from_utf8_lossy(&kill_result.stderr);
                                eprintln!("Failed to kill v2ray service: {}", error_message);
                            }
                        }
                        Err(e) => {
                            eprintln!("Error executing taskkill command: {}", e);
                        }
                    }
                } else {
                    println!("v2ray service is not running.");
                }
            }
            Err(e) => {
                eprintln!("Error executing tasklist command: {}", e);
            }
        }
    }

    #[cfg(not(target_os = "windows"))]
    {
        // Unix-like systems implementation
        // Use 'pgrep' to check if the process is running and 'pkill' to terminate it.

        // Define the pattern to search for the v2ray process
        let process_pattern = "v2ray run -c";

        // Check if the v2ray process is running
        let check_output = Command::new("pgrep")
            .arg("-f")
            .arg(process_pattern)
            .output();

        match check_output {
            Ok(output) => {
                if output.status.success() {
                    // If the process is running, attempt to kill it
                    let kill_output = Command::new("pkill")
                        .arg("-f")
                        .arg(process_pattern)
                        .output();

                    match kill_output {
                        Ok(kill_result) => {
                            if kill_result.status.success() {
                                println!("v2ray service killed successfully.");
                            } else {
                                // If pkill fails, capture and print stderr
                                let error_message = String::from_utf8_lossy(&kill_result.stderr);
                                eprintln!("Failed to kill v2ray service: {}", error_message);
                            }
                        }
                        Err(e) => {
                            eprintln!("Error executing pkill command: {}", e);
                        }
                    }
                } else {
                    println!("v2ray service is not running.");
                }
            }
            Err(e) => {
                eprintln!("Error executing pgrep command: {}", e);
            }
        }
    }
}

pub async fn reset_proxy_v2ray_status(app: &AppHandle) {
    let database_path = utils::get_database_path(app).to_string_lossy().to_string();
    let database_url = format!("sqlite://{}", database_path);

    if !Path::new(&database_path).exists() {
        error!("Failed to determine the database path. on reset_proxy_v2ray_status");
        eprintln!("Failed to determine the database path. on reset_proxy_v2ray_status");
        return;
    }

    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .map_err(|e| format!("Failed to connect to the database: {}", e))
        .unwrap();

    let user_id: String = sqlx::query("SELECT UserID FROM AppStatus WHERE LoginState = 1")
        .fetch_optional(&pool)
        .await
        .unwrap_or(None) // Default to None if query fails
        .map(|row: SqliteRow| row.get::<String, _>("UserID"))
        .unwrap_or_else(|| "".to_string()); // Return "" if no row is found
    if user_id.is_empty() {
        info!("No user is currently logged in.");
    } else {
        info!("Logged in UserID: {}", user_id);
        let is_auto_start_proxy: i32 =
            sqlx::query("SELECT AutoStartProxy FROM AppSettings WHERE UserID = ?")
                .bind(&user_id)
                .fetch_one(&pool)
                .await
                .map(|row: SqliteRow| row.get::<i32, _>("AutoStartProxy"))
                .unwrap_or_else(|_| 0);

        if is_auto_start_proxy == 1 {
            let daemon_state = app.state::<Arc<Mutex<DaemonState>>>();
            let window = app.get_webview_window("main").unwrap();
            if let Err(e) = v2ray_core::start_daemon(daemon_state, window).await {
                error!("Failed to start daemon: {}", e);
            }
            sqlx::query("UPDATE AppStatus SET ServiceRunningState = 1 WHERE UserID = ?;")
                .bind(&user_id)
                .execute(&pool)
                .await
                .expect("Failed to update service running state");
        } else {
            sqlx::query("UPDATE AppStatus SET ServiceRunningState = 0 WHERE UserID = ?;")
                .bind(&user_id)
                .execute(&pool)
                .await
                .expect("Failed to update service running state");
        }
        sqlx::query("UPDATE AppSettings SET ProxyMode = ? WHERE UserID = ?;")
            .bind(&"manual")
            .bind(&user_id)
            .execute(&pool)
            .await
            .expect("Failed to update proxy mode");
    }
}

#[tauri::command]
pub async fn graceful_restart(app: AppHandle, user_id: String) -> Result<(), String> {
    let daemon_state = app.state::<Arc<Mutex<DaemonState>>>();
    let pac_server_manage = app.state::<Mutex<proxy::PacServerShutdownHandle>>();
    unset_pac_proxy(pac_server_manage).unwrap();
    unset_global_proxy().unwrap();
    let main_window = app
        .get_webview_window("main")
        .expect("Main window not found");
    let database_path = utils::get_database_path(&app).to_string_lossy().to_string();

    let database_url = format!("sqlite://{}", database_path);
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .map_err(|e| format!("Failed to connect to the database: {}", e))
        .unwrap();
    sqlx::query("UPDATE AppSettings SET ProxyMode = ? WHERE UserID = ?;")
        .bind(&"manual")
        .bind(&user_id)
        .execute(&pool)
        .await
        .expect("Failed to update proxy mode");
    if let Err(e) = v2ray_core::stop_daemon(daemon_state, main_window).await {
        error!("Failed to start daemon: {}", e);
    }
    sqlx::query("UPDATE AppStatus SET ServiceRunningState = 0 WHERE UserID = ?;")
        .bind(&user_id)
        .execute(&pool)
        .await
        .expect("Failed to update service running state");
    app.restart();
}
