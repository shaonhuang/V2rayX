use anyhow::Result; // You can still use anyhow for internal error handling
use lazy_static::lazy_static;
use log::{error, info};
use std::fs::File;
use std::io::Write;
use std::sync::{Arc, Mutex};
use tauri::State;
use tauri::WebviewWindow;
use tauri::{path, Manager};
use tauri_plugin_notification::NotificationExt;

use tauri::AppHandle;
use tauri_plugin_shell::process::{CommandChild, CommandEvent};
use tauri_plugin_shell::ShellExt;
pub mod v2ray_config;
use crate::utils;

lazy_static! {
    static ref SERVICE_LOCK: Mutex<()> = Mutex::new(());
}

pub struct DaemonState {
    pub child: Option<CommandChild>,
    // pub rx: Option<Receiver<CommandEvent>>,
}

impl DaemonState {
    pub fn new() -> Self {
        DaemonState {
            child: None,
            // rx: None,
        }
    }
}

impl Drop for DaemonState {
    fn drop(&mut self) {
        if let Some(child) = self.child.take() {
            if let Err(e) = child.kill() {
                error!("The daemon cannot be terminated: {}", e);
            } else {
                info!("The daemon has been terminated on Drop");
            }
        }
    }
}

#[tauri::command]
pub async fn inject_config(app: AppHandle, endpoint_id: String, user_id: String) -> bool {
    let config_path = app
        .path()
        .resolve("config.json", path::BaseDirectory::AppData)
        .expect("Failed to resolve path");

    // Build the database path
    let database_path = utils::get_database_path(&app).to_string_lossy().to_string();

    // Step 4: Call generate_config and handle the result
    let config_result =
        v2ray_config::generate_config(user_id.clone(), endpoint_id, database_path).await;

    let generated_config = match config_result {
        Ok(config) => config,
        Err(e) => {
            error!("generate_config error: {}", e);
            return false;
        }
    };

    // Step 5: Write the generated configuration to the file
    let mut file = match File::create(&config_path) {
        Ok(f) => f,
        Err(e) => {
            error!("File creation error: {}", e);
            return false;
        }
    };

    if let Err(e) = file.write_all(generated_config.as_bytes()) {
        error!("File write error: {}", e);
        return false;
    }

    info!("Configuration successfully written to {:?}", config_path);
    true
}

#[tauri::command]
pub async fn start_daemon(
    state: State<'_, Arc<Mutex<DaemonState>>>,
    window: WebviewWindow,
) -> Result<bool, String> {
    let config_path = window
        .app_handle()
        .path()
        .resolve("config.json", path::BaseDirectory::AppData)
        .expect("Failed to resolve path");

    let args = vec!["run", "-c", config_path.to_str().expect("REASON")];

    let mut daemon = state.lock().unwrap();
    {
        if daemon.child.is_some() {
            info!("v2ray-core daemon is already running");
            return Ok(false);
        }
    }

    let sidecar = window
        .app_handle()
        .shell()
        .sidecar("v2ray")
        .map_err(|e| e.to_string())?
        .args(args);

    let mut success = true;

    match sidecar.spawn() {
        Ok((mut rx, _child)) => {
            daemon.child = Some(_child);
            tauri::async_runtime::spawn(async move {
                // #[cfg(debug_assertions)]
                while let Some(event) = rx.recv().await {
                    match event {
                        CommandEvent::Stdout(line) => {
                            println!("[v2ray] {:?}", String::from_utf8(line));
                        }
                        CommandEvent::Stderr(line) => {
                            println!("[v2ray] {:?}", String::from_utf8(line));
                            success = false;
                        }
                        CommandEvent::Error(line) => eprintln!("error: {:?}", line),
                        CommandEvent::Terminated(status) => {
                            success = if status.code.unwrap_or(1) == 0 {
                                true
                            } else {
                                false
                            };
                        }
                        _ => {}
                    }
                }
            });
        }
        Err(err) => panic!("{err}"),
    }
    window
        .app_handle()
        .notification()
        .builder()
        .title("V2rayX")
        .body("v2ray-core proxy daemon started")
        .show()
        .unwrap();

    println!("success {:?}", success);
    Ok(success)
}

#[tauri::command]
pub async fn stop_daemon(
    state: State<'_, Arc<Mutex<DaemonState>>>,
    window: WebviewWindow,
) -> Result<bool, String> {
    let mut daemon = state.lock().unwrap();

    if let Some(child) = daemon.child.take() {
        // Take ownership of CommandChild
        child
            .kill()
            .map_err(|e| format!("Failed to kill daemon: {}", e))?;
        // rx = None;
        info!("v2ray-core daemon stopped");

        window
            .app_handle()
            .notification()
            .builder()
            .title("V2rayX")
            .body("v2ray-core proxy daemon stopped")
            .show()
            .unwrap();
        Ok(true)
    } else {
        info!("v2ray-core daemon is not running");
        Ok(true)
    }
}

#[tauri::command]
pub async fn check_daemon_status(
    state: State<'_, Arc<Mutex<DaemonState>>>,
) -> Result<bool, String> {
    let daemon = state.lock().unwrap();
    Ok(daemon.child.is_some())
}
