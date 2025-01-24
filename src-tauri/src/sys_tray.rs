#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use log::{error, info};
use serde::Serialize;
use sqlx::sqlite::SqlitePoolOptions;
use sqlx::sqlite::SqliteRow;
use sqlx::FromRow;
use sqlx::Row;
use std::env;
use std::sync::Mutex;
use tauri::menu::{
    IsMenuItem, Menu, MenuBuilder, MenuId, MenuItem, MenuItemBuilder, PredefinedMenuItem,
    SubmenuBuilder,
};
use tauri::Emitter;
use tauri::WindowEvent;
use tauri::{
    tray::{TrayIcon, TrayIconBuilder},
    AppHandle, Manager, Wry,
};
use tauri_plugin_clipboard_manager::ClipboardExt;
use tauri_plugin_opener::OpenerExt;
use tauri_plugin_os;

use crate::proxy;
use crate::proxy::unset_global_proxy;
use crate::proxy::unset_pac_proxy;
use crate::v2ray_core;
use crate::v2ray_core::DaemonState;
use std::sync::Arc;

use anyhow::Result;

use crate::utils;
use tauri::path::BaseDirectory;
use tauri_plugin_notification::NotificationExt;

// Initialize internationalization
rust_i18n::i18n!("locales");

const V2RAY_CORE_VERSION: &str = dotenvy_macro::dotenv!("VITE_V2RAY_CORE_VERSION");

#[derive(Debug, FromRow)]
struct AppStatus {
    ServiceRunningState: i32,
    V2rayCoreVersion: String,
    AppVersion: String,
    UserID: String,
    LoginState: i32,
}

#[derive(Clone, Serialize)]
pub struct SystemTrayPayload {
    message: String,
}

impl SystemTrayPayload {
    pub fn new(message: &str) -> Self {
        Self {
            message: message.to_string(),
        }
    }
}

pub enum TrayState {
    Paused,
    Running,
}

pub struct SystemTrayManager {
    tray_handle: TrayIcon,
    tray_state: Mutex<TrayState>,
}

impl SystemTrayManager {
    pub async fn new(app_handle: &AppHandle, user_id: String) -> Self {
        // Create the tray menu with internationalized labels
        let menu = create_tray_menu(app_handle.clone(), &user_id).await;

        let database_path = utils::get_database_path(app_handle)
            .to_string_lossy()
            .to_string();

        let database_url = format!("sqlite://{}", database_path);
        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect(&database_url)
            .await
            .map_err(|e| format!("Failed to connect to the database: {}", e))
            .unwrap();
        let hide_tray: i32 = sqlx::query("SELECT HideTrayBar FROM AppSettings WHERE UserID = ?")
            .bind(&user_id)
            .fetch_one(&pool)
            .await
            .map(|row: SqliteRow| row.get::<i32, _>("HideTrayBar"))
            .unwrap_or_else(|_| 0);
        #[cfg(target_os = "macos")]
        {
            if hide_tray == 0 {
                app_handle.set_activation_policy(tauri::ActivationPolicy::Accessory);
            }
        }
        // Build the tray icon
        let tray_handle = TrayIconBuilder::new()
            .icon(app_handle.default_window_icon().unwrap().clone())
            .icon_as_template(false)
            .menu(&menu)
            .show_menu_on_left_click(true)
            .on_menu_event(move |app, event| {
                let main_window = app
                    .get_webview_window("main")
                    .expect("Main window not found");
                let opener = app.opener();
                let event_id = event.id().as_ref();
                if event_id.starts_with("endpoint:") {
                let endpoint_id = event_id.trim_start_matches("endpoint:").to_string();
                // Spawn a new task to handle the endpoint selection
                tauri::async_runtime::block_on(async {
	                let tray_manager = app.state::<SystemTrayManager>();
                	println!("endpoint: {}", &endpoint_id);
	                let daemon_state = app.state::<Arc<Mutex<DaemonState>>>();
	                if let Err(e) = v2ray_core::stop_daemon(daemon_state, main_window).await {
	                    error!("Failed to start daemon: {}", e);
	                }
	                let success = v2ray_core::inject_config(app.app_handle().clone(), endpoint_id.clone(), user_id.clone()).await;
	                if !success {
	                    error!("Failed to inject_config");
	                }
					sqlx::query("UPDATE AppStatus SET ServiceRunningState = 0 WHERE UserID = ?;")
						.bind(&user_id)
						.execute(&pool)
						.await
						.expect("Failed to update service running state");
					sqlx::query("UPDATE Endpoints SET Active = CASE WHEN EndpointID = ? THEN 1 ELSE 0 END WHERE Active = 1 OR EndpointID = ?;")
				        .bind(&endpoint_id)
						.bind(&endpoint_id)
						.execute(&pool)
						.await
						.expect("Failed to update service running state");
					tray_manager
						.update_menu(&app, user_id.clone())
						.await;
					app.emit("refresh","endpoints").unwrap();
                });
            }
            else {
                match event_id {
                    "show" => {
                        dbg!("menu item show clicked");
                        let main_window = app.get_webview_window("main").unwrap();
                        if main_window.is_visible().unwrap() {
                            // main_window.hide().unwrap();
                            main_window.set_focus().unwrap();
                            // item_handle.set_title("Show Window").unwrap();
                        } else {
                            main_window.show().unwrap();
                            // item_handle.set_title("Hide Window").unwrap();
                        }
                    }
                    "check-website" => app
                        .opener()
                        .open_url("https://github.com/shaonhuang/V2rayX", None::<&str>)
                        .unwrap(),
                    "help" => app
                        .opener()
                        .open_url("https://t.me/V2rayX_electron", None::<&str>)
                        .unwrap(),
                    "quit" => {
	                    tauri::async_runtime::block_on(async {
							let daemon_state = app.state::<Arc<Mutex<DaemonState>>>();
							let pac_server_manage = app.state::<Mutex<proxy::PacServerShutdownHandle>>();
	                     	unset_pac_proxy(pac_server_manage).unwrap();
	                      	unset_global_proxy().unwrap();
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
		                    app.exit(0);
	                    });
               		 }
                    "hide" => {
                        dbg!("menu item hide clicked");
                        let window = app.get_webview_window("main").unwrap();
                        window.hide().unwrap();
                    }
                    "toggle-service" => {
                        let tray_manager = app.state::<SystemTrayManager>();
                        let mut tray_state = tray_manager.tray_state.lock().unwrap();
                        match *tray_state {
                            TrayState::Running => {
                                tauri::async_runtime::block_on(async {
	                                let daemon_state = app.state::<Arc<Mutex<DaemonState>>>();
	                                if let Err(e) = v2ray_core::stop_daemon(daemon_state, main_window).await {
                                            error!("Failed to start daemon: {}", e);
                                    }
                                    sqlx::query("UPDATE AppStatus SET ServiceRunningState = 0 WHERE UserID = ?;")
										.bind(&user_id)
										.execute(&pool)
										.await
										.expect("Failed to update service running state");

                                    tray_manager
                                        .update_menu(&app, user_id.clone())
                                        .await;
                                    app.emit("refresh","endpoints").unwrap();
                                    *tray_state = TrayState::Paused;
                                });
                            }
                            TrayState::Paused => {
                                tauri::async_runtime::block_on(async {
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

                                    tray_manager
                                        .update_menu(&app, user_id.clone())
                                        .await;
                                    app.emit("refresh","endpoints").unwrap();
                                    *tray_state = TrayState::Running;
                                });
                            }
                        }
                    }
                    "view-config" => {
						let config_path = app.path().resolve("config.json", BaseDirectory::AppData).expect("Failed to resolve config.json path").to_string_lossy().to_string();
						println!("config_path: {}", config_path);
						opener.open_path(config_path, None::<&str>).unwrap();
                    }
                    "view-pac" => {
						main_window.eval("window.remixNavigate('/settings')").unwrap();
						if main_window.is_visible().unwrap() {
                            main_window.set_focus().unwrap();
                        } else {
                            main_window.show().unwrap();
                        }
					}
                    "view-log" => {
	                    let app_log = app.path()
							.resolve("app-logs.log", BaseDirectory::AppLog)
							.expect("Failed to resolve path")
							.to_string_lossy()
                            .to_string();
						println!("app_log: {}", app_log);
						opener.open_path(app_log, None::<&str>).unwrap();
                    }
                    "switch-pac" => {
	                    tauri::async_runtime::block_on(async {
							if let Err(e) = proxy::unset_global_proxy() {
								error!("Failed to unset_global_proxy: {}", e);
                            }
	                        // if let Err(e) = proxy::unset_pac_proxy() {
                         //        error!("Failed to unset_pac_proxy: {}", e);
                         //    }
                            let (custom_rules, http_port,socks_port): (String, i32, i32) = sqlx::query_as(
	                            "SELECT
									(SELECT i.PAC FROM AppSettings i WHERE i.UserID = ?) AS custom_rules,
							        (SELECT i.Port FROM Inbounds i WHERE i.UserID = ? AND i.Tag = 'http-inbound') AS http_port,
							        (SELECT i.Port FROM Inbounds i WHERE i.UserID = ? AND i.Tag = 'socks-inbound') AS socks_port,
							        a.BypassDomains
							    FROM AppSettings a
							    WHERE a.UserID = ?")
								.bind(&user_id)
								.bind(&user_id)
								.bind(&user_id)
								.bind(&user_id)
								.fetch_one(&pool)
								.await
								.expect("Failed to fetch proxy settings");

                            let pac_server_manage = app.state::<Mutex<proxy::PacServerShutdownHandle>>();
                            proxy::setup_pac_proxy(app.app_handle().clone(), custom_rules, http_port as u16, socks_port as u16, pac_server_manage).await;
							let tray_manager = app.state::<SystemTrayManager>();
							let new_proxy_mode = "pac";
							sqlx::query("UPDATE AppSettings SET ProxyMode = ? WHERE UserID = ?;")
								.bind(&new_proxy_mode)
								.bind(&user_id)
								.execute(&pool)
								.await
								.expect("Failed to update proxy mode");

							tray_manager
								.update_menu(&app, user_id.clone())
								.await;
							app.emit("refresh","dashboard").unwrap();
	                    });
					}
					"switch-global" => {
					    tauri::async_runtime::block_on(async {
							// if let Err(e) = proxy::unset_global_proxy() {
       //                              error!("Failed to unset_global_proxy: {}", e);
       //                      }
       						let pac_server_manage = app.state::<Mutex<proxy::PacServerShutdownHandle>>();
							if let Err(e) = proxy::unset_pac_proxy(pac_server_manage) {
	                            error!("Failed to unset_pac_proxy: {}", e);
                            }
                            let (http_listen, http_port, socks_listen, socks_port, bypass_domains): (String, i32, String, i32, String) = sqlx::query_as(
                                "SELECT
							        (SELECT i.Listen FROM Inbounds i WHERE i.UserID = ? AND i.Tag = 'http-inbound') AS http_listen,
							        (SELECT i.Port FROM Inbounds i WHERE i.UserID = ? AND i.Tag = 'http-inbound') AS http_port,
							        (SELECT i.Listen FROM Inbounds i WHERE i.UserID = ? AND i.Tag = 'socks-inbound') AS socks_listen,
							        (SELECT i.Port FROM Inbounds i WHERE i.UserID = ? AND i.Tag = 'socks-inbound') AS socks_port,
							        a.BypassDomains
							    FROM AppSettings a
							    WHERE a.UserID = ?"
                            )
                                .bind(&user_id)
                                .bind(&user_id)
                                .bind(&user_id)
                                .bind(&user_id)
                                .bind(&user_id)
                                .fetch_one(&pool)
                                .await
                                .expect("Failed to fetch proxy settings");

                            let bypass_domains: Vec<String> = serde_json::from_str::<serde_json::Value>(&bypass_domains)
                                .expect("Failed to parse JSON")
                                .get("bypass")
                                .expect("Failed to get bypass field")
                                .as_array()
                                .expect("Bypass field is not an array")
                                .iter()
                                .map(|v| v.as_str().expect("Array element is not a string").to_string())
                                .collect();

                            // println!("http_listen: {}, http_port: {}, socks_listen: {}, socks_port: {}, bypass_domains: {:?}", http_listen, http_port, socks_listen, socks_port, bypass_domains);
                            if let Err(e) = proxy::setup_global_proxy(http_listen, http_port as u16, socks_port as u16, bypass_domains) {
                                error!("Failed to setup_global_proxy: {}", e);
                            }

							let tray_manager = app.state::<SystemTrayManager>();
							let new_proxy_mode = "global";
							sqlx::query("UPDATE AppSettings SET ProxyMode = ? WHERE UserID = ?;")
								.bind(&new_proxy_mode)
								.bind(&user_id)
								.execute(&pool)
								.await
								.expect("Failed to update proxy mode");

							tray_manager
								.update_menu(&app, user_id.clone())
								.await;
							app.emit("refresh","dashboard").unwrap();
						});
					}
					"switch-manual" => {
	                    tauri::async_runtime::block_on(async {
							let tray_manager = app.state::<SystemTrayManager>();
							let new_proxy_mode = "manual";
							if let Err(e) = proxy::unset_global_proxy() {
                                        error!("Failed to unset_global_proxy: {}", e);
                                }
                            let pac_server_manage = app.state::<Mutex<proxy::PacServerShutdownHandle>>();
	                        if let Err(e) = proxy::unset_pac_proxy(pac_server_manage) {
	                                    error!("Failed to unset_pac_proxy: {}", e);
	                            }
							sqlx::query("UPDATE AppSettings SET ProxyMode = ? WHERE UserID = ?;")
								.bind(&new_proxy_mode)
								.bind(&user_id)
								.execute(&pool)
								.await
								.expect("Failed to update proxy mode");

							tray_manager
								.update_menu(&app, user_id.clone())
								.await;
							app.emit("refresh","dashboard").unwrap();
	                    });
					}
					"configure-endpoints" => {
						main_window.eval("window.remixNavigate('/endpoints')").unwrap();
                        if main_window.is_visible().unwrap() {
                            main_window.set_focus().unwrap();
                        } else {
                            main_window.show().unwrap();
                        }
					}
					"configure-pac-settings" => {

					}
					"copy-proxy-cmd" => {
						tauri::async_runtime::block_on(async {
							let (http_listen, http_port, socks_listen, socks_port, bypass_domains): (String, i32, String, i32, String) = sqlx::query_as(
                                "SELECT
									(SELECT i.Listen FROM Inbounds i WHERE i.UserID = ? AND i.Tag = 'http-inbound') AS http_listen,
									(SELECT i.Port FROM Inbounds i WHERE i.UserID = ? AND i.Tag = 'http-inbound') AS http_port,
									(SELECT i.Listen FROM Inbounds i WHERE i.UserID = ? AND i.Tag = 'socks-inbound') AS socks_listen,
									(SELECT i.Port FROM Inbounds i WHERE i.UserID = ? AND i.Tag = 'socks-inbound') AS socks_port,
								a.BypassDomains
								FROM AppSettings a
								WHERE a.UserID = ?"
                            )
                                .bind(&user_id)
                                .bind(&user_id)
                                .bind(&user_id)
                                .bind(&user_id)
                                .bind(&user_id)
                                .fetch_one(&pool)
                                .await
                                .expect("Failed to fetch proxy settings");
							let bypass_domains: Vec<String> = serde_json::from_str::<serde_json::Value>(&bypass_domains)
                                .expect("Failed to parse JSON")
                                .get("bypass")
                                .expect("Failed to get bypass field")
                                .as_array()
                                .expect("Bypass field is not an array")
                                .iter()
                                .map(|v| v.as_str().expect("Array element is not a string").to_string())
                                .collect();
							let platform = tauri_plugin_os::platform();
							let content = if platform == "windows" {
									format!(
										"set HTTP_PROXY=http://{}:{} \n\
										set HTTPS_PROXY=http://{}:{} \n\
										set ALL_PROXY=socks5://{}:{} \n\
										set NO_PROXY='{}'",
										http_listen, http_port, http_listen, http_port, socks_listen, socks_port, bypass_domains.join(",")
									)
								} else {
									format!(
										"export http_proxy=http://{}:{}; export https_proxy=http://{}:{}; export all_proxy=socks5://{}:{}; export no_proxy='{}';",
										http_listen, http_port, http_listen, http_port, socks_listen, socks_port, bypass_domains.join(",")
									)
								};
							app.clipboard().write_text(content.clone()).unwrap();
					        main_window
					            .app_handle()
					            .notification()
					            .builder()
					            .title("V2rayX")
					            .body(format!("Proxy command copied to clipboard: {}", content))
					            .show()
					            .unwrap();
						});
					}
					"preferences" => {
						main_window.eval("window.remixNavigate('/settings')").unwrap();
						if main_window.is_visible().unwrap() {
                            main_window.set_focus().unwrap();
                        } else {
                            main_window.show().unwrap();
                        }
					}

                    // Handle other menu items similarly...
                    _ => {
                        // Emit an event to the frontend if needed
                        // main_window
                        //     .emit("systemTray", SystemTrayPayload::new(&id))
                        //     .expect("Failed to emit systemTray event");
                    }
                }
        	}
            })
            .build(app_handle)
            .expect("Failed to build tray icon");

        // Initialize tray state
        let tray_state = Mutex::new(TrayState::Paused);

        tray_handle
            .set_visible(if hide_tray == 1 { false } else { true })
            .unwrap();

        Self {
            tray_handle,
            tray_state,
        }
    }

    /// Updates the tray menu based on the selected language
    pub async fn update_menu(&self, app_handle: &AppHandle, user_id: String) {
        let new_menu = create_tray_menu(app_handle.clone(), &user_id).await;
        self.tray_handle
            .set_menu(Some(new_menu))
            .expect("Failed to update tray menu");
    }
}

pub async fn init_tray(app_handle: AppHandle) -> Result<SystemTrayManager> {
    let database_path = utils::get_database_path(&app_handle)
        .to_string_lossy()
        .to_string();
    let database_url = format!("sqlite://{}", database_path);
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
        let hide_tray: i32 = sqlx::query("SELECT HideTrayBar FROM AppSettings WHERE UserID = ?")
            .bind(&user_id)
            .fetch_one(&pool)
            .await
            .map(|row: SqliteRow| row.get::<i32, _>("HideTrayBar"))
            .unwrap_or_else(|_| 0);
        let window = app_handle
            .clone()
            .get_webview_window("main")
            .expect("Main window not found");

        // Clone app_handle for the closure to avoid moving the original
        let app_handle_for_event = app_handle.clone();

        window.clone().on_window_event(move |event| {
            // Use the cloned app_handle inside the closure
            let app_handle = app_handle_for_event.clone();

            match event {
                WindowEvent::CloseRequested { api, .. } => {
                    if hide_tray != 1 {
                        api.prevent_close();
                        if let Err(e) = window.clone().hide() {
                            eprintln!("Failed to hide window: {}", e);
                        }
                    } else {
                        let pac_server_manage =
                            app_handle.state::<Mutex<proxy::PacServerShutdownHandle>>();
                        unset_pac_proxy(pac_server_manage);
                        unset_global_proxy();

                        // Access states using the cloned app_handle
                        let daemon_state = app_handle.state::<Arc<Mutex<DaemonState>>>();

                        tauri::async_runtime::block_on(async {
                            if let Err(e) =
                                v2ray_core::stop_daemon(daemon_state, window.clone()).await
                            {
                                error!("Failed to stop daemon: {}", e);
                            }
                        });
                    }
                }
                _ => {}
            }
        });

        // Now, the original app_handle is still available for use
        info!("Logged in UserID: {}", user_id);
    }

    // Initialize the SystemTrayManager using the original app_handle
    let tray_manager = SystemTrayManager::new(&app_handle, user_id).await;
    info!("SystemTrayManager initialized.");
    Ok(tray_manager)
}

/// Creates the tray menu with internationalized labels
pub async fn create_tray_menu(app: AppHandle, user_id: &str) -> Menu<Wry> {
    let menu: Menu<Wry>;

    let database_path = utils::get_database_path(&app).to_string_lossy().to_string();
    let database_url = format!("sqlite://{}", database_path);
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .map_err(|e| format!("Failed to connect to the database: {}", e))
        .unwrap();

    let lang = if user_id.is_empty() {
        "en".to_string() // Default language
    } else {
        sqlx::query("SELECT Language FROM AppSettings WHERE UserID = ?")
            .bind(&user_id)
            .fetch_optional(&pool)
            .await
            .unwrap_or(None) // Default to None if query fails
            .map(|row: SqliteRow| row.get::<String, _>("Language"))
            .unwrap_or_else(|| {
                info!(
                    "No language setting found for UserID: {}. Defaulting to 'en'.",
                    user_id
                );
                "en".to_string() // Default to "en" if no language is found
            })
    };

    // Set the locale for translations
    rust_i18n::set_locale(&lang);

    if user_id.is_empty() {
        let open_window = MenuItemBuilder::new("Open Window".to_string())
            .id("show")
            .build(&app)
            .unwrap();
        let check_website = MenuItemBuilder::new("Check Official Website".to_string())
            .id("check-website")
            .build(&app)
            .unwrap();

        let help = MenuItemBuilder::new("Help".to_string())
            .id("help")
            .build(&app)
            .unwrap();

        let quit = MenuItemBuilder::new("Quit".to_string())
            .accelerator("CmdOrCtrl+Q")
            .id("quit")
            .build(&app)
            .unwrap();
        menu = MenuBuilder::new(&app)
            .items(&[&open_window, &check_website, &help, &quit])
            .build()
            .unwrap();
    } else {
        let service_running_state_query: SqliteRow =
            sqlx::query("SELECT ServiceRunningState FROM AppStatus")
                .fetch_one(&pool)
                .await
                .map_err(|e| format!("Failed to execute query: {}", e))
                .unwrap();

        let service_running_state: i32 = service_running_state_query.get("ServiceRunningState");

        // Determine the status label
        let status_label = format!(
            "v2ray-core: {} (v{})",
            if service_running_state == 1 {
                "On"
            } else {
                "Off"
            },
            env::var("VITE_V2RAY_CORE_VERSION").unwrap_or_else(|_| V2RAY_CORE_VERSION.to_string())
        );

        // Define custom menu items with unique IDs
        let status_item = MenuItemBuilder::new(status_label.to_string())
            .enabled(false)
            .id("status")
            .build(&app)
            .unwrap();

        let is_selected_endpoint: bool =
            sqlx::query("SELECT COUNT(*) FROM Endpoints WHERE Active = 1")
                .fetch_one(&pool)
                .await
                .map(|row: SqliteRow| row.get::<i32, _>(0))
                .unwrap_or_else(|_| 0)
                > 0;

        let toggle_service = MenuItemBuilder::new(format!(
            "Turn v2ray-core {}",
            if service_running_state == 1 {
                "Off"
            } else {
                "On"
            }
        ))
        .enabled(is_selected_endpoint)
        .accelerator("CmdOrCtrl+T")
        .id("toggle-service")
        .build(&app)
        .unwrap();

        let view_config = MenuItemBuilder::new("View Config.json".to_string())
            .id("view-config")
            .build(&app)
            .unwrap();

        let view_pac = MenuItemBuilder::new("Open PAC Setting".to_string())
            .id("view-pac")
            .build(&app)
            .unwrap();

        let view_logs = MenuItemBuilder::new("View App Log File".to_string())
            .id("view-log")
            .build(&app)
            .unwrap();

        let proxy_mode: String = sqlx::query("SELECT ProxyMode FROM AppSettings WHERE UserID = ?")
            .bind(&user_id)
            .fetch_one(&pool)
            .await
            .map(|row: SqliteRow| row.get::<String, _>("ProxyMode"))
            .unwrap();

        let switch_pac_label = if proxy_mode == "pac" {
            "✓ PAC Mode".to_string()
        } else {
            "PAC Mode".to_string()
        };
        let switch_pac = MenuItemBuilder::new(switch_pac_label)
            .id("switch-pac")
            .build(&app)
            .unwrap();

        let global_mode_label = if proxy_mode == "global" {
            "✓ Global Mode".to_string()
        } else {
            "Global Mode".to_string()
        };
        let global_mode = MenuItemBuilder::new(global_mode_label)
            .id("switch-global")
            .build(&app)
            .unwrap();

        let manual_mode_label = if proxy_mode == "manual" {
            "✓ Manual Mode".to_string()
        } else {
            "Manual Mode".to_string()
        };
        let manual_mode = MenuItemBuilder::new(manual_mode_label)
            .id("switch-manual")
            .build(&app)
            .unwrap();

        let endpoint_rows = sqlx::query(
            "SELECT Endpoints.EndpointID, Endpoints.Remark, Endpoints.Active
             FROM Endpoints
             JOIN EndpointsGroups ON Endpoints.GroupID = EndpointsGroups.GroupID
             WHERE EndpointsGroups.UserID = ?",
        )
        .bind(&user_id)
        .fetch_all(&pool)
        .await
        .expect("Failed to fetch endpoints from the database");

        let mut menu_items: Vec<MenuItem<Wry>> = Vec::new();
        if endpoint_rows.is_empty() {
            // No endpoints found; insert a default "No Endpoints" menu item
            let no_endpoints_item = MenuItemBuilder::new("No Endpoints Available")
                .id(MenuId::new("no_endpoints"))
                .enabled(false) // Disable the menu item to prevent interaction
                .build(&app)
                .expect("Failed to build 'No Endpoints' menu item");

            menu_items.push(no_endpoints_item);
        } else {
            // Endpoints found; create menu items for each endpoint
            for row in endpoint_rows {
                let endpoint_id: String = row.get("EndpointID");
                let mut remark: String = row.get("Remark");
                let is_active: i32 = row.get("Active");
                let is_disabled: bool = is_active != 1;

                if is_active == 1 {
                    // Using Unicode checkmark. You can choose a different symbol if desired.
                    remark = format!("✓ {}", remark);
                }

                let menu_item = MenuItemBuilder::new(&remark)
                    .enabled(is_disabled)
                    .id(MenuId::new(&format!("endpoint:{}", endpoint_id)))
                    .build(&app)
                    .expect("Failed to build menu item");

                menu_items.push(menu_item);
            }
        }
        let menu_items_refs: Vec<&dyn tauri::menu::IsMenuItem<Wry>> = menu_items
            .iter()
            .map(|item| item as &dyn tauri::menu::IsMenuItem<Wry>)
            .collect();

        let endpoints_submenu = SubmenuBuilder::new(&app, "Endpoints...".to_string())
            .id("endpoints")
            .items(&menu_items_refs)
            .separator()
            .build()
            .expect("Failed to build endpoints submenu");

        let configure_endpoints = MenuItemBuilder::new("Configure...".to_string())
            .accelerator("CmdOrCtrl+C")
            .id("configure-endpoints")
            .build(&app)
            .unwrap();

        let configure_subscriptions = MenuItemBuilder::new("Subscriptions...".to_string())
            .enabled(false)
            .id("configure-subscriptions")
            .build(&app)
            .unwrap();

        let configure_pac_settings = MenuItemBuilder::new("PAC Settings...".to_string())
            .enabled(false)
            .id("configure-pac-settings")
            .build(&app)
            .unwrap();

        let connection_test = MenuItemBuilder::new("Connection Test...".to_string())
            .enabled(false)
            .id("connection-test")
            .build(&app)
            .unwrap();

        let import_endpoint = MenuItemBuilder::new("Import Server From Pasteboard".to_string())
            .enabled(false)
            .id("import-endpoint")
            .build(&app)
            .unwrap();

        let scan_qr = MenuItemBuilder::new("Scan QR Code From Screen".to_string())
            .enabled(false)
            .id("scan-qr")
            .build(&app)
            .unwrap();

        let share_link = MenuItemBuilder::new("Share Link/QR Code".to_string())
            .enabled(false)
            .id("share-link")
            .build(&app)
            .unwrap();

        let copy_proxy_cmd = MenuItemBuilder::new("Copy HTTP Proxy Shell Command".to_string())
            .accelerator("CmdOrCtrl+E")
            .id("copy-proxy-cmd")
            .build(&app)
            .unwrap();

        let preferences = MenuItemBuilder::new("Preferences...".to_string())
            .accelerator("CmdOrCtrl+,")
            .id("preferences")
            .build(&app)
            .unwrap();

        let check_website = MenuItemBuilder::new("Check Official Website".to_string())
            .id("check-website")
            .build(&app)
            .unwrap();

        let help = MenuItemBuilder::new("Help".to_string())
            .id("help")
            .build(&app)
            .unwrap();

        let quit = MenuItemBuilder::new("Quit".to_string())
            .accelerator("CmdOrCtrl+Q")
            .id("quit")
            .build(&app)
            .unwrap();

        // Now create the final menu_items vector with references
        let menu_divider = PredefinedMenuItem::separator(&app).unwrap();

        // Build the menu
        menu = MenuBuilder::new(&app)
            .items(&[
                &status_item,
                &toggle_service,
                &menu_divider as &dyn IsMenuItem<Wry>,
                &view_config,
                &view_pac,
                &view_logs,
                &menu_divider as &dyn IsMenuItem<Wry>,
                &switch_pac,
                &global_mode,
                &manual_mode,
                &menu_divider as &dyn IsMenuItem<Wry>,
                &endpoints_submenu,
                &configure_endpoints,
                &configure_subscriptions,
                &configure_pac_settings,
                &connection_test,
                &menu_divider as &dyn IsMenuItem<Wry>,
                &import_endpoint,
                &scan_qr,
                &share_link,
                &menu_divider as &dyn IsMenuItem<Wry>,
                &copy_proxy_cmd,
                &menu_divider as &dyn IsMenuItem<Wry>,
                &preferences,
                &check_website,
                &help,
                &menu_divider as &dyn IsMenuItem<Wry>,
                &quit,
            ])
            .build()
            .unwrap();
    }

    menu
}

#[tauri::command]
pub async fn tray_update(app: AppHandle, user_id: String) -> Result<(), String> {
    // Check if SystemTrayManager is available
    if let Some(tray_manager) = app.try_state::<SystemTrayManager>() {
        let database_path = utils::get_database_path(&app).to_string_lossy().to_string();
        let database_url = format!("sqlite://{}", database_path);
        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect(&database_url)
            .await
            .map_err(|e| format!("Failed to connect to the database: {}", e))
            .unwrap();
        let hide_tray: i32 = sqlx::query("SELECT HideTrayBar FROM AppSettings WHERE UserID = ?")
            .bind(&user_id)
            .fetch_one(&pool)
            .await
            .map(|row: SqliteRow| row.get::<i32, _>("HideTrayBar"))
            .unwrap_or_else(|_| 0);
        if hide_tray == 1 {
            tray_manager.tray_handle.set_visible(false).unwrap();
        } else {
            tray_manager.tray_handle.set_visible(true).unwrap();
        }

        let service_running_state_query: SqliteRow =
            sqlx::query("SELECT ServiceRunningState FROM AppStatus")
                .fetch_one(&pool)
                .await
                .map_err(|e| format!("Failed to execute query: {}", e))
                .unwrap();

        let service_running_state: i32 = service_running_state_query.get("ServiceRunningState");

        // Update the tray menu with the new language and user ID
        tray_manager.update_menu(&app, user_id.clone()).await;

        let mut tray_state = tray_manager.tray_state.lock().unwrap();
        *tray_state = if service_running_state == 1 {
            TrayState::Running
        } else {
            TrayState::Paused
        };
        // Log the successful update
        info!("Tray menu updated with user_id: '{}'", user_id);

        Ok(())
    } else {
        // Handle the case where SystemTrayManager is not found
        let error_message = "SystemTrayManager not found in app state.".to_string();
        error!("{}", error_message);
        Err(error_message)
    }
}
