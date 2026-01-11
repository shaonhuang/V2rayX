use crate::proxy;
use crate::proxy::{unset_global_proxy, unset_pac_proxy};
use crate::utils;
use crate::v2ray_core;
use crate::v2ray_core::DaemonState;
use base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine};
use chrono::Local;
use image::ImageOutputFormat;
use log::{error, info};
use reqwest::Client;
use screenshots::Screen;
use sqlx::sqlite::SqlitePoolOptions;
use sqlx::sqlite::SqliteRow;
use sqlx::Row;
use std::io::Cursor;
use std::net::TcpStream;
use std::net::ToSocketAddrs;
use std::path::Path;
use std::process::Command;
use std::sync::{Arc, Mutex, RwLock};
use std::time::{Duration, Instant};
use tauri::{
    // state is used in Linux
    self,
    AppHandle,
    Manager,
    State,
};
use tauri_plugin_notification::NotificationExt;

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
    log::info!("Closing splashscreen");
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
    // Execute the appropriate commands based on the OS
    #[cfg(target_os = "windows")]
    {
        // Define the process pattern based on the operating system
        let process_pattern = "v2ray.exe run -c";
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

#[tauri::command]
pub async fn update_endpoints_latency(
    app: AppHandle,
    group_id: String,
    user_id: String,
) -> Result<(), String> {
    use reqwest::Client;
    use std::net::{TcpStream, ToSocketAddrs};
    use std::time::{Duration, Instant};

    // Helper function to resolve a host and port to a socket address
    fn resolve_host(host: &str, port: u16) -> Result<std::net::SocketAddr, String> {
        let addr_str = format!("{}:{}", host, port);
        match addr_str.to_socket_addrs() {
            Ok(mut addrs) => {
                if let Some(addr) = addrs.next() {
                    Ok(addr)
                } else {
                    Err(format!("Could not resolve address: {}", addr_str))
                }
            }
            Err(e) => Err(format!("Failed to resolve address {}: {}", addr_str, e)),
        }
    }

    // Connect to the database
    let database_path = utils::get_database_path(&app).to_string_lossy().to_string();
    let database_url = format!("sqlite://{}", database_path);
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .map_err(|e| format!("Failed to connect to the database: {}", e))?;

    // Get the group's SpeedTestType
    let group_info: (String, String) = sqlx::query_as(
        "SELECT GroupName, SpeedTestType FROM EndpointsGroups WHERE GroupID = ? AND UserID = ?",
    )
    .bind(&group_id)
    .bind(&user_id)
    .fetch_one(&pool)
    .await
    .map_err(|e| format!("Failed to fetch group info: {}", e))?;

    let (group_name, speed_test_type) = group_info;

    // Get latency test settings
    let latency_settings: (String, i64) = sqlx::query_as(
        "SELECT LatencyTestUrl, LatencyTestTimeout FROM AppSettings WHERE UserID = ?",
    )
    .bind(&user_id)
    .fetch_one(&pool)
    .await
    .map_err(|e| format!("Failed to fetch latency test settings: {}", e))?;

    let (test_url, timeout) = latency_settings;
    let timeout = Duration::from_millis(timeout as u64);

    // Get all endpoints for this group
    let endpoints = sqlx::query(
        "SELECT e.EndpointID, e.Remark,
         CASE o.Protocol
            WHEN 'vmess' THEN (SELECT v.Address FROM VmessVnext v JOIN VmessUsers u ON v.VnextID = u.VnextID WHERE u.EndpointID = e.EndpointID)
            WHEN 'shadowsocks' THEN (SELECT Address FROM Shadowsocks WHERE EndpointID = e.EndpointID)
            WHEN 'trojan' THEN (SELECT Address FROM TrojanServers WHERE EndpointID = e.EndpointID)
            WHEN 'hysteria2' THEN (SELECT Address FROM Hysteria2 WHERE EndpointID = e.EndpointID)
            ELSE NULL
         END AS Address,
         CASE o.Protocol
            WHEN 'vmess' THEN (SELECT v.Port FROM VmessVnext v JOIN VmessUsers u ON v.VnextID = u.VnextID WHERE u.EndpointID = e.EndpointID)
            WHEN 'shadowsocks' THEN (SELECT Port FROM Shadowsocks WHERE EndpointID = e.EndpointID)
            WHEN 'trojan' THEN (SELECT Port FROM TrojanServers WHERE EndpointID = e.EndpointID)
            WHEN 'hysteria2' THEN (SELECT Port FROM Hysteria2 WHERE EndpointID = e.EndpointID)
            ELSE NULL
         END AS Port
         FROM Endpoints e
         LEFT JOIN Outbounds o ON e.EndpointID = o.EndpointID
         WHERE e.GroupID = ?"
    )
    .bind(&group_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Failed to fetch endpoints: {}", e))?;

    // Process each endpoint
    for endpoint in endpoints {
        let endpoint_id: String = endpoint.get("EndpointID");
        let address: Option<String> = endpoint.get("Address");
        let port: Option<i64> = endpoint.get("Port");

        // If address or port is NULL, skip this endpoint
        if address.is_none() || port.is_none() {
            // Update with timeout status
            sqlx::query("UPDATE Endpoints SET Latency = NULL WHERE EndpointID = ?")
                .bind(&endpoint_id)
                .execute(&pool)
                .await
                .map_err(|e| format!("Failed to update endpoint latency: {}", e))?;
            continue;
        }

        let address = address.unwrap();
        let port = port.unwrap() as u16;

        // Test latency based on the SpeedTestType
        let latency_result = match speed_test_type.to_lowercase().as_str() {
            "ping" => {
                // Simple ICMP ping is not easily available in Rust without root privileges
                // Use TCP connection as a fallback for "ping"
                let start = Instant::now();
                // Resolve the address first
                match resolve_host(&address, port) {
                    Ok(socket_addr) => match TcpStream::connect_timeout(&socket_addr, timeout) {
                        Ok(_) => {
                            let duration = start.elapsed();
                            Ok(duration.as_millis() as i64)
                        }
                        Err(e) => {
                            info!("TCP connection to {} failed: {}", socket_addr, e);
                            Err("Connection timeout".to_string())
                        }
                    },
                    Err(e) => {
                        info!("Failed to resolve address for {}: {}", address, e);
                        Err(format!("Address resolution failed: {}", e))
                    }
                }
            }
            "connect" => {
                // TCP connection test
                let start = Instant::now();
                // Resolve the address first
                match resolve_host(&address, port) {
                    Ok(socket_addr) => match TcpStream::connect_timeout(&socket_addr, timeout) {
                        Ok(_) => {
                            let duration = start.elapsed();
                            Ok(duration.as_millis() as i64)
                        }
                        Err(e) => {
                            info!("TCP connection to {} failed: {}", socket_addr, e);
                            Err("Connection timeout".to_string())
                        }
                    },
                    Err(e) => {
                        info!("Failed to resolve address for {}: {}", address, e);
                        Err(format!("Address resolution failed: {}", e))
                    }
                }
            }
            "tcp" => {
                // First, check basic TCP connectivity to ensure endpoint is reachable
                let tcp_start = Instant::now();

                // Resolve the address first
                match resolve_host(&address, port) {
                    Ok(socket_addr) => {
                        match TcpStream::connect_timeout(&socket_addr, timeout) {
                            Ok(_) => {
                                // If TCP connection is successful, proceed with HTTP test
                                let client = match Client::builder().timeout(timeout).build() {
                                    Ok(client) => client,
                                    Err(e) => {
                                        return Err(format!("Failed to build HTTP client: {}", e))
                                    }
                                };

                                // Try to connect to the test URL and time the response
                                let http_start = Instant::now();
                                match client.get(&test_url).send().await {
                                    Ok(response) => {
                                        if response.status().is_success() {
                                            let duration = http_start.elapsed();
                                            Ok(duration.as_millis() as i64)
                                        } else {
                                            // HTTP connection worked but returned an error status
                                            info!(
                                                "HTTP test for endpoint {} returned status: {}",
                                                endpoint_id,
                                                response.status()
                                            );
                                            // Use the TCP time as a fallback
                                            let tcp_duration = tcp_start.elapsed();
                                            Ok(tcp_duration.as_millis() as i64)
                                        }
                                    }
                                    Err(e) => {
                                        info!(
                                            "HTTP test for endpoint {} failed: {}",
                                            endpoint_id, e
                                        );
                                        // TCP succeeded but HTTP failed, use TCP time as a basic measure
                                        let tcp_duration = tcp_start.elapsed();
                                        Ok(tcp_duration.as_millis() as i64)
                                    }
                                }
                            }
                            Err(e) => {
                                info!("TCP connection to {} failed: {}", socket_addr, e);
                                Err(format!("TCP connection failed: {}", e))
                            }
                        }
                    }
                    Err(e) => {
                        info!("Failed to resolve address for {}: {}", address, e);
                        Err(format!("Address resolution failed: {}", e))
                    }
                }
            }
            _ => Err(format!("Unknown speed test type: {}", speed_test_type)),
        };

        // Update the endpoint latency in the database
        match latency_result {
            Ok(latency) => {
                sqlx::query("UPDATE Endpoints SET Latency = ? WHERE EndpointID = ?")
                    .bind(latency.to_string())
                    .bind(&endpoint_id)
                    .execute(&pool)
                    .await
                    .map_err(|e| format!("Failed to update endpoint latency: {}", e))?;
            }
            Err(_) => {
                // Set to NULL if timeout
                sqlx::query("UPDATE Endpoints SET Latency = NULL WHERE EndpointID = ?")
                    .bind(&endpoint_id)
                    .execute(&pool)
                    .await
                    .map_err(|e| format!("Failed to update endpoint latency: {}", e))?;
            }
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn take_screenshot(app: AppHandle) -> Result<String, String> {
    let screens = Screen::all().map_err(|e| e.to_string())?;

    if let Some(screen) = screens.first() {
        let image = screen.capture().map_err(|e| e.to_string())?;

        let mut buffer = Vec::new();
        let mut cursor = Cursor::new(&mut buffer);
        image
            .write_to(&mut cursor, ImageOutputFormat::Png)
            .map_err(|e| e.to_string())?;

        let base64_image = BASE64_STANDARD.encode(&buffer);

        Ok(format!("data:image/png;base64,{}", base64_image))
    } else {
        Err("No screen found".to_string())
    }
}

#[tauri::command]
pub async fn test_proxy_connection(app: AppHandle, user_id: String) -> Result<String, String> {
    // Get the database connection
    let database_path = utils::get_database_path(&app).to_string_lossy().to_string();
    let database_url = format!("sqlite://{}", database_path);
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .map_err(|e| format!("Failed to connect to the database: {}", e))?;

    // Get the socks port from the Inbounds table
    let socks_port: Option<i64> =
        sqlx::query_scalar("SELECT Port FROM Inbounds WHERE UserID = ? AND Tag = 'socks-inbound'")
            .bind(&user_id)
            .fetch_optional(&pool)
            .await
            .map_err(|e| format!("Failed to fetch socks port: {}", e))?
            .flatten();

    let socks_port = match socks_port {
        Some(port) => port as u16,
        None => return Err("No socks inbound found for this user".to_string()),
    };

    // Function to get IP via SOCKS5 proxy
    async fn get_ip_via_socks5(port: u16) -> Result<String, reqwest::Error> {
        let proxy = reqwest::Proxy::all(&format!("socks5://127.0.0.1:{}", port))?;
        let client = reqwest::Client::builder()
            .proxy(proxy)
            .timeout(std::time::Duration::from_secs(5))
            .build()?;

        let response = client.get("http://ipv4.ifconfig.me").send().await?;
        let ip = response.text().await?;
        Ok(ip)
    }

    // Try to get the IP via SOCKS5 proxy
    let proxy_ip = match get_ip_via_socks5(socks_port).await {
        Ok(ip) => ip,
        Err(e) => return Err(format!("Failed to get IP via SOCKS5 proxy: {}", e)),
    };

    // First, get the active endpoint ID and its protocol
    let active_endpoint_info = sqlx::query(
        "SELECT e.EndpointID, o.Protocol
         FROM Endpoints e
         JOIN Outbounds o ON e.EndpointID = o.EndpointID
         WHERE e.Active = 1",
    )
    .fetch_optional(&pool)
    .await
    .map_err(|e| format!("Failed to fetch active endpoint: {}", e))?;

    if let Some(endpoint_info) = active_endpoint_info {
        let endpoint_id: String = endpoint_info.get("EndpointID");
        let protocol: String = endpoint_info.get("Protocol");

        // Based on the protocol, query the appropriate table to get the address
        let address: Option<String> = match protocol.as_str() {
            "vmess" => sqlx::query_scalar(
                "SELECT v.Address
                     FROM VmessVnext v
                     JOIN VmessUsers u ON v.VnextID = u.VnextID
                     WHERE u.EndpointID = ?",
            )
            .bind(&endpoint_id)
            .fetch_optional(&pool)
            .await
            .map_err(|e| format!("Failed to fetch vmess address: {}", e))?,
            "shadowsocks" => {
                sqlx::query_scalar("SELECT Address FROM Shadowsocks WHERE EndpointID = ?")
                    .bind(&endpoint_id)
                    .fetch_optional(&pool)
                    .await
                    .map_err(|e| format!("Failed to fetch shadowsocks address: {}", e))?
            }
            "trojan" => {
                sqlx::query_scalar("SELECT Address FROM TrojanServers WHERE EndpointID = ?")
                    .bind(&endpoint_id)
                    .fetch_optional(&pool)
                    .await
                    .map_err(|e| format!("Failed to fetch trojan address: {}", e))?
            }
            "hysteria2" => sqlx::query_scalar("SELECT Address FROM Hysteria2 WHERE EndpointID = ?")
                .bind(&endpoint_id)
                .fetch_optional(&pool)
                .await
                .map_err(|e| format!("Failed to fetch hysteria2 address: {}", e))?,
            _ => None,
        };

        if let Some(addr) = address {
            // Check if the proxy IP matches any part of the endpoint address
            let service_running =
                if addr.contains(&proxy_ip) || is_domain_resolves_to_ip(&addr, &proxy_ip).await {
                    true
                } else {
                    info!(
                        "Proxy IP {} doesn't match endpoint address {} (protocol: {})",
                        proxy_ip, addr, protocol
                    );
                    false
                };

            // Update the AppStatus table
            sqlx::query("UPDATE AppStatus SET ServiceRunningState = ? WHERE UserID = ?")
                .bind(if service_running { 1 } else { 0 })
                .bind(&user_id)
                .execute(&pool)
                .await
                .map_err(|e| format!("Failed to update service state: {}", e))?;

            return Ok(format!(
                "Proxy IP: {}, Protocol: {}, Address: {}, Service running: {}, Port: {}",
                proxy_ip, protocol, addr, service_running, socks_port
            ));
        } else {
            // Address not found for this protocol
            sqlx::query("UPDATE AppStatus SET ServiceRunningState = 0 WHERE UserID = ?")
                .bind(&user_id)
                .execute(&pool)
                .await
                .map_err(|e| format!("Failed to update service state: {}", e))?;

            return Ok(format!(
                "Proxy IP: {}, Protocol: {}, No address found, Service running: false, Port: {}",
                proxy_ip, protocol, socks_port
            ));
        }
    }

    // No active endpoint found
    sqlx::query("UPDATE AppStatus SET ServiceRunningState = 0 WHERE UserID = ?")
        .bind(&user_id)
        .execute(&pool)
        .await
        .map_err(|e| format!("Failed to update service state: {}", e))?;

    Ok(format!(
        "Proxy IP: {}, No active endpoint found, Port: {}",
        proxy_ip, socks_port
    ))
}

// Helper function to check if a domain might resolve to a given IP
// This is a simplified implementation and would need a real DNS resolver for production
async fn is_domain_resolves_to_ip(domain: &str, ip: &str) -> bool {
    // If the domain is already an IP, just compare directly
    if domain.split('.').count() == 4 && domain.chars().all(|c| c.is_digit(10) || c == '.') {
        return domain == ip;
    }

    // For domains, we should do a DNS lookup, but for simplicity
    // we'll just return false in this example
    // In a real implementation, you'd use tokio::net::lookup_host or similar
    false
}

#[tauri::command]
pub async fn fetch_subscription_data(url: String) -> Result<String, String> {
    info!("Fetching subscription from URL: {}", url);

    // Create HTTP client with timeout and user agent
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(30))
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| {
            info!("Failed to create HTTP client: {}", e);
            format!("Failed to create HTTP client: {}", e)
        })?;

    // Make the request
    info!("Sending request to URL: {}", url);
    let response = client.get(&url).send().await.map_err(|e| {
        let error_message = format!("Failed to fetch subscription: {}", e);
        info!("{}", error_message);
        if e.is_timeout() {
            "Connection timed out. Please check your internet connection and try again.".to_string()
        } else if e.is_connect() {
            "Connection error. Please check your internet connection and try again.".to_string()
        } else {
            error_message
        }
    })?;

    // Check response status
    if !response.status().is_success() {
        let error_message = format!("Failed to fetch subscription: HTTP status {}", response.status());
        info!("{}", error_message);
        return Err(error_message);
    }

    // Get response body
    let raw_data = response.text().await.map_err(|e| {
        let error_message = format!("Failed to read response body: {}", e);
        info!("{}", error_message);
        error_message
    })?;

    info!("Successfully got response text, length: {} bytes", raw_data.len());

    // Check if response is empty
    if raw_data.trim().is_empty() {
        info!("Subscription data is empty");
        return Err("Subscription data is empty".to_string());
    }

    // Try to decode as base64, return decoded or raw data
    info!("Attempting to decode base64 data");
    match BASE64_STANDARD.decode(raw_data.trim()) {
        Ok(decoded) => {
            match String::from_utf8(decoded) {
                Ok(decoded_str) => {
                    info!("Successfully decoded subscription data, length: {} bytes", decoded_str.len());
                    Ok(decoded_str)
                }
                Err(e) => {
                    info!("Subscription data is not valid UTF-8 after base64 decoding: {}", e);
                    info!("Returning raw response data");
                    Ok(raw_data)
                }
            }
        }
        Err(e) => {
            info!("Subscription data is not valid base64: {}", e);
            info!("Returning raw response data");
            Ok(raw_data)
        }
    }
}

#[tauri::command]
pub async fn send_notification(
    app: AppHandle,
    title: String,
    body: String,
) -> Result<(), String> {
    let window = app
        .get_webview_window("main")
        .ok_or("Main window not found")?;
    
    window
        .app_handle()
        .notification()
        .builder()
        .title(&title)
        .body(&body)
        .show()
        .map_err(|e| format!("Failed to show notification: {}", e))?;
    
    Ok(())
}
