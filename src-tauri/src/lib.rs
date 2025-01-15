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
mod utils;
mod v2ray_core;

use dotenvy::dotenv;
use serde::Serialize;
use std::env;
use std::sync::{Arc, Mutex};
use tauri::{
    // state is used in Linux
    self,
    Manager,
};
use tauri_plugin_autostart::MacosLauncher;

const SENTRY_DSN: &str = dotenvy_macro::dotenv!("SENTRY_DSN");
#[derive(Clone, Serialize)]
struct SingleInstancePayload {
    args: Vec<String>,
    cwd: String,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    dotenv().ok();

    #[cfg(not(debug_assertions))]
    let _guard = sentry::init((
        env::var("SENTRY_DSN").unwrap_or_else(|_| SENTRY_DSN.to_string()),
        sentry::ClientOptions {
            release: sentry::release_name!(),
            ..Default::default()
        },
    ));
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
        .plugin(tauri_plugin_single_instance::init(|app, args, cwd| {}))
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
            v2ray_core::inject_config,
            v2ray_core::start_daemon,
            v2ray_core::stop_daemon,
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
                app.manage(app_state);
                app.manage(daemon_state.clone());
                let pac_server_manage = app.state::<Mutex<proxy::PacServerShutdownHandle>>();
                proxy::unset_pac_proxy(pac_server_manage).unwrap();
                proxy::unset_global_proxy().unwrap();
                #[cfg(desktop)]
                app.handle()
                    .plugin(tauri_plugin_updater::Builder::new().build());

                tauri::async_runtime::block_on(async {
                    commands::reset_proxy_v2ray_status(app.app_handle()).await;
                    app.manage(sys_tray::init_tray(app.app_handle().clone()).await.unwrap());
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
        .expect("error while running tauri application");
}
