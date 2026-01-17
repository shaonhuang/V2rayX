// this hides the console for Windows release builds
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

// #[macro_use]
extern crate rust_i18n;

mod commands;
mod migrations;
mod proxy;
mod sys_tray;
mod telemetry;
mod utils;
mod v2ray_core;

use dotenvy::dotenv;
use std::env;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Mutex};
use log::{error, info, warn};
use tauri::{
    self,
    Manager,
};
use tauri_plugin_autostart::MacosLauncher;

#[cfg(not(debug_assertions))]
const SENTRY_DSN: &str = dotenvy_macro::dotenv!("VITE_SENTRY_DSN");

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    dotenv().ok();

    #[cfg(not(debug_assertions))]
    let _guard = sentry::init((
        env::var("VITE_SENTRY_DSN").unwrap_or_else(|_| SENTRY_DSN.to_string()),
        sentry::ClientOptions {
            release: sentry::release_name!(),
            ..Default::default()
        },
    ));
    
    // Initialize Axiom telemetry
    if let Ok(config) = telemetry::TelemetryConfig::from_env() {
        if let Err(e) = telemetry::init_axiom_client(config) {
            warn!("Failed to initialize Axiom telemetry: {}", e);
        } else {
            info!("Axiom telemetry initialized successfully");
            // Daily summary task will be started in setup() where async runtime is available
        }
    } else {
        info!("Axiom telemetry not configured (VITE_AXIOM_API_TOKEN, AXIOM_API_TOKEN, or AXIOM_TOKEN not set)");
    }
    
    let app_state = commands::AppState::new();
    let daemon_state = Arc::new(Mutex::new(v2ray_core::DaemonState::new()));
    let migrations = migrations::get_migrations();
    log::info!("booting up");
    tauri::Builder::default()
        .manage(Mutex::new(proxy::PacServerShutdownHandle {
            shutdown_tx: None,
        }))
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:database.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_single_instance::init(|_, _, _| {}))
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--flag1", "--flag2"]), /* arbitrary number of args to pass to your app */
        ))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            commands::close_splashscreen,
            commands::get_elapsed_time,
            commands::graceful_restart,
            commands::take_screenshot,
            commands::update_endpoints_latency,
            commands::test_proxy_connection,
            commands::fetch_subscription_data,
            commands::send_notification,
            commands::reset_database,
            v2ray_core::inject_config,
            v2ray_core::start_daemon,
            v2ray_core::stop_daemon,
            v2ray_core::stop_v2ray_daemon,
            v2ray_core::check_daemon_status,
            proxy::setup_pac_proxy,
            proxy::unset_pac_proxy,
            proxy::setup_global_proxy,
            proxy::unset_global_proxy,
            sys_tray::tray_update,
        ])
        .setup({
            commands::clear_v2ray_core_service();

            move |app| {
                // Check for database migration issues before proceeding
                // This check happens in setup, but migration errors occur during plugin initialization
                // So we'll also handle errors in the run() error handler below
                let database_path = utils::get_database_path(app.app_handle());
                if database_path.exists() {
                    // Try to detect potential migration issues by checking database accessibility
                    // Note: Actual migration errors will be caught in the run() error handler
                    if let Err(e) = check_database_migration_issue(&database_path) {
                        let error_msg = format!("{}", e);
                        if commands::is_database_migration_error(&error_msg) {
                            info!("Potential database migration issue detected");
                            // Show dialog using system native dialog
                            let app_handle = app.app_handle().clone();
                            let should_reset = tauri::async_runtime::block_on(async {
                                show_migration_error_dialog(&app_handle).await
                            });
                            if should_reset {
                                let app_handle_clone = app.app_handle().clone();
                                tauri::async_runtime::block_on(async {
                                    if let Err(e) = commands::reset_database(app_handle_clone).await {
                                        error!("Failed to reset database: {}", e);
                                    } else {
                                        info!("Database reset successfully, application will continue");
                                        // Database will be recreated on next plugin initialization
                                    }
                                });
                            }
                        }
                    }
                }

                app.manage(app_state);
                app.manage(daemon_state.clone());
                let pac_server_manage = app.state::<Mutex<proxy::PacServerShutdownHandle>>();
                proxy::unset_pac_proxy(pac_server_manage).unwrap();
                proxy::unset_global_proxy().unwrap();
                #[cfg(desktop)]
                let _ = app
                    .handle()
                    .plugin(tauri_plugin_updater::Builder::new().build());

                tauri::async_runtime::block_on(async {
                    commands::reset_proxy_v2ray_status(app.app_handle()).await;
                    app.manage(sys_tray::init_tray(app.app_handle().clone()).await.unwrap());
                    
                    // Start daily summary task now that async runtime is available
                    if telemetry::is_initialized() {
                        telemetry::start_daily_summary_task();
                        
                        // Track daily active user (DAU)
                        if let Err(e) = telemetry::track_daily_active().await {
                            warn!("Failed to track daily active user: {}", e);
                        }
                        
                        // Send initial usage event
                        if let Err(e) = telemetry::send_event("app_started", None, None).await {
                            warn!("Failed to send app_started event: {}", e);
                        }
                    }
                });
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .target(tauri_plugin_log::Target::new(
                            tauri_plugin_log::TargetKind::Webview,
                        ))
                        .target(tauri_plugin_log::Target::new(
                            tauri_plugin_log::TargetKind::LogDir {
                                file_name: Some("app-logs".to_string()),
                            },
                        ))
                        .max_file_size(50_000 /* bytes */)
                        .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)
                        .format(|out, message, record| {
                            out.finish(format_args!(
                                "[{} {}] {}",
                                record.level(),
                                record.target(),
                                message
                            ))
                        })
                        .timezone_strategy(tauri_plugin_log::TimezoneStrategy::UseLocal)
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;

                Ok(())
            }
        })
        .run(tauri::generate_context!())
        .map_err(|error| {
            let error_msg = format!("{}", error);
            error!("Application error: {}", error_msg);
            
            // Check if this is a database migration error
            if commands::is_database_migration_error(&error_msg) {
                error!("Database migration error detected: {}", error_msg);
                
                // Show dialog and handle database reset
                // This function will exit the process, so we won't reach the expect() below
                handle_migration_error_dialog();
            }
            error
        })
        .expect("error while running tauri application");
}

fn check_database_migration_issue(db_path: &Path) -> Result<(), String> {
    // Check if database file exists and try to detect migration issues
    // We'll check if the migration table exists and can be read
    use sqlx::sqlite::SqlitePoolOptions;
    use std::time::Duration;
    
    let database_url = format!("sqlite://{}", db_path.display());
    
    // Try to connect with a short timeout
    let rt = tokio::runtime::Runtime::new().map_err(|e| format!("Failed to create runtime: {}", e))?;
    
    rt.block_on(async {
        let pool = SqlitePoolOptions::new()
            .max_connections(1)
            .acquire_timeout(Duration::from_secs(2))
            .connect(&database_url)
            .await
            .map_err(|e| {
                let err_str = format!("{}", e);
                // Check if error message indicates migration issue
                if err_str.contains("migration") || err_str.contains("was previously applied but has been modified") {
                    return format!("Migration error: {}", e);
                }
                format!("Database connection error: {}", e)
            })?;
        
        // Try to query the migration table to see if it exists and is readable
        let result = sqlx::query("SELECT version FROM _sqlx_migrations ORDER BY version DESC LIMIT 1")
            .fetch_optional(&pool)
            .await;
        
        match result {
            Ok(_) => Ok(()),
            Err(e) => {
                let err_str = format!("{}", e);
                // If error contains migration-related keywords, it's likely a migration issue
                if err_str.contains("migration") || err_str.contains("no such table") {
                    warn!("Migration table error detected: {}", err_str);
                    Err(format!("Migration table error: {}", e))
                } else {
                    // Other errors might not be migration-related
                    Ok(())
                }
            }
        }
    })
}

fn handle_migration_error_dialog() {
    use std::fs;
    use std::process::{Command, Stdio};
    use std::env;
    
    // Try to get database path using Tauri context, fallback to manual detection
    let database_path = get_database_path_for_error();
    
    info!("Database migration error detected! Automatically resetting database and restarting...");
    
    // Automatically delete the database file
    let db_deleted = if let Some(db_path) = &database_path {
        if db_path.exists() {
            match fs::remove_file(db_path) {
                Ok(_) => {
                    info!("Database file deleted successfully at: {}", db_path.display());
                    true
                }
                Err(e) => {
                    error!("Failed to delete database file: {}", e);
                    eprintln!("\n===========================================");
                    eprintln!("Database Migration Error!");
                    eprintln!("===========================================");
                    eprintln!("Failed to delete database file: {}", e);
                    eprintln!("Database location: {}", db_path.display());
                    eprintln!("Please manually delete the database file and restart the application.");
                    eprintln!("===========================================\n");
                    false
                }
            }
        } else {
            // Database doesn't exist, which is fine
            info!("Database file does not exist, nothing to delete");
            true
        }
    } else {
        // Couldn't determine database path
        error!("Could not determine database location");
        eprintln!("\n===========================================");
        eprintln!("Database Migration Error!");
        eprintln!("===========================================");
        eprintln!("Could not determine database location.");
        eprintln!("Please manually delete the database.db file and restart the application.");
        eprintln!("===========================================\n");
        false
    };
    
    if db_deleted {
        info!("Database reset successfully. Restarting application...");
        
        // Restart the application
        if let Ok(exe_path) = env::current_exe() {
            // Spawn a new process with the same executable
            #[cfg(unix)]
            {
                // On Unix-like systems, spawn directly
                if let Err(e) = Command::new(&exe_path)
                    .stdin(Stdio::null())
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .spawn()
                {
                    error!("Failed to restart application: {}", e);
                    eprintln!("Failed to restart application. Please restart manually.");
                } else {
                    info!("Application restart initiated");
                }
            }
            
            #[cfg(windows)]
            {
                // On Windows, spawn directly
                if let Err(e) = Command::new(&exe_path)
                    .stdin(Stdio::null())
                    .stdout(Stdio::null())
                    .stderr(Stdio::null())
                    .spawn()
                {
                    error!("Failed to restart application: {}", e);
                    eprintln!("Failed to restart application. Please restart manually.");
                } else {
                    info!("Application restart initiated");
                }
            }
        } else {
            error!("Could not determine executable path for restart");
            eprintln!("Could not determine executable path. Please restart the application manually.");
        }
    }
    
    // Exit gracefully - the new process should start
    std::process::exit(0);
}

fn get_database_path_for_error() -> Option<PathBuf> {
    // Try to construct path manually based on OS
    // This is called when the app fails to start, so we can't use AppHandle
    get_database_path_fallback()
}

fn get_database_path_fallback() -> Option<PathBuf> {
    // Try to get the database path without AppHandle
    // This is a fallback method that tries to construct the path manually
    
    #[cfg(target_os = "macos")]
    {
        // On macOS, Tauri typically stores app config in ~/Library/Application Support/<app-name>/
        if let Ok(home) = env::var("HOME") {
            // Try multiple possible app names
            let possible_names = vec!["v2rayx", "V2rayX", "v2rayx.shaonhuang"];
            
            for app_name in possible_names {
                let mut path = PathBuf::from(&home);
                path.push("Library");
                path.push("Application Support");
                path.push(app_name);
                path.push("database.db");
                
                if path.exists() {
                    return Some(path);
                }
            }
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        // On Windows, typically in %APPDATA%\<app-name>\
        if let Ok(appdata) = env::var("APPDATA") {
            let app_name = env::var("TAURI_APP_NAME")
                .or_else(|_| env::var("APP_NAME"))
                .unwrap_or_else(|_| "V2rayX".to_string());
            
            let mut path = PathBuf::from(appdata);
            path.push(&app_name);
            path.push("database.db");
            
            if path.exists() {
                return Some(path);
            }
        }
    }
    
    #[cfg(target_os = "linux")]
    {
        // On Linux, typically in ~/.config/<app-name>/
        if let Ok(home) = env::var("HOME") {
            let app_name = env::var("TAURI_APP_NAME")
                .or_else(|_| env::var("APP_NAME"))
                .unwrap_or_else(|_| "V2rayX".to_string());
            
            let mut path = PathBuf::from(home);
            path.push(".config");
            path.push(&app_name);
            path.push("database.db");
            
            if path.exists() {
                return Some(path);
            }
        }
    }
    
    None
}

async fn show_migration_error_dialog(_app: &tauri::AppHandle) -> bool {
    // Use system native dialog since Tauri dialog API might not be available
    #[cfg(target_os = "macos")]
    {
        use std::process::Command;
        let script = r#"
            osascript -e 'tell application "System Events" to display dialog "Database Migration Error\n\nA database migration issue was detected. This usually happens when upgrading to a new version.\n\nDo you want to reset the database? All data will be deleted." buttons {"Cancel", "Reset Database"} default button "Reset Database" with icon stop' -e 'if button returned of result is "Reset Database" then return 0 else return 1'
        "#;
        if let Ok(output) = Command::new("sh").arg("-c").arg(script).output() {
            return output.status.success();
        }
    }
    
    #[cfg(not(target_os = "macos"))]
    {
        // For other platforms, default to false (don't reset) to be safe
        // User can manually delete the database file if needed
        warn!("Database migration issue detected on non-macOS platform. Please manually delete the database file.");
    }
    
    false
}
