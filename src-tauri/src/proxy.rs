#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use log::{error, info};
use std::fs;
use std::io;
use std::sync::Arc;
use std::sync::Mutex;
use tauri::AppHandle;
use tauri::{
    // state is used in Linux
    self,
    command,
    Manager,
};
use tokio::sync::oneshot;
use tokio::sync::Notify;
use warp::Filter;

#[cfg(target_os = "windows")]
use winreg::enums::*;
#[cfg(target_os = "windows")]
use winreg::RegKey;

#[cfg(target_os = "macos")]
use std::process::Command;

#[cfg(target_os = "linux")]
use std::process::Command;

pub struct PacServerShutdownHandle {
    pub shutdown_tx: Option<oneshot::Sender<()>>,
}

/// Generates a PAC file with the specified proxy settings.
///
/// # Arguments
///
/// * `gfw_list_text` - The GFW list as a string.
/// * `pac_template_path` - Path to the PAC template file.
/// * `pac_output_path` - Path where the final PAC file will be written.
/// * `http_port` - The HTTP proxy port.
/// * `socks5_port` - The SOCKS5 proxy port.
///
/// # Errors
///
/// Returns an `io::Error` if any file operations fail.
fn generate_pac_file(
    custom_rules: &str,
    gfw_list_text_path: &str,
    pac_template_path: &str,
    pac_output_path: &str,
    http_port: u16,
    socks5_port: u16,
) -> io::Result<()> {
    info!("Starting PAC file generation...");

    let gfw_list_text = fs::read_to_string(gfw_list_text_path).map_err(|e| {
        error!("Failed to read GFW list from {}: {}", gfw_list_text_path, e);
        e
    })?;
    info!("Read GFW list from {}.", gfw_list_text_path);
    // Step 1: Process GFW list
    let rules: Vec<String> = custom_rules
        .lines()
        .chain(gfw_list_text.lines()) // Merge custom_rules and GFW list
        .map(|line| line.trim()) // Trim whitespace
        .filter(|line| !line.is_empty() && !line.starts_with('!') && !line.starts_with('[')) // Exclude comments and empty lines
        .map(|line| format!("\"{}\"", line)) // Format as quoted strings
        .collect();

    info!("Processed {} rules from GFW list.", rules.len());
    let rules_js = format!("[\n{}\n]", rules.join(",\n"));
    // Step 2: Read the PAC template
    let template_content = fs::read_to_string(pac_template_path).map_err(|e| {
        error!(
            "Failed to read PAC template from {}: {}",
            pac_template_path, e
        );
        e
    })?;

    info!("Read PAC template from {}.", pac_template_path);

    // Step 3: Inject rules and ports into the template
    let pac_content = template_content
        .replace("__RULES__", &rules_js)
        .replace("__HTTP__PORT__", &http_port.to_string())
        .replace("__SOCKS5__PORT__", &socks5_port.to_string());

    info!("Injected rules and ports into PAC template.");

    // Optional: Validate PAC content (basic syntax check)
    if !validate_pac(&pac_content) {
        let err_msg = "Generated PAC content is invalid.";
        error!("{}", err_msg);
        return Err(io::Error::new(io::ErrorKind::InvalidData, err_msg));
    }

    // Step 4: Write the final PAC file
    fs::write(pac_output_path, pac_content).map_err(|e| {
        error!("Failed to write PAC file to {}: {}", pac_output_path, e);
        e
    })?;

    info!("PAC file generated successfully at {}.", pac_output_path);

    Ok(())
}

/// Basic validation to check if the PAC content contains the required function.
/// This can be expanded to perform more thorough syntax checks if needed.
fn validate_pac(pac_content: &str) -> bool {
    pac_content.contains("function FindProxyForURL")
}

#[cfg(target_os = "windows")]
/// Sets global proxy settings on Windows.
fn set_global_proxy_windows(host: &str, http_port: u16, socks_port: u16) -> std::io::Result<()> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let internet_settings = hkcu.open_subkey_with_flags(
        "Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings",
        KEY_WRITE,
    )?;

    // Enable Proxy
    internet_settings.set_value("ProxyEnable", &1u32)?;
    internet_settings.set_value(
        "ProxyServer",
        &format!(
            "http={}:{};https={}:{};socks={}:{}",
            host, http_port, host, http_port, host, socks_port
        ),
    )?;

    // Optional: Set Proxy Override (bypass list)
    // internet_settings.set_value("ProxyOverride", &"<local>")?;

    Ok(())
}

#[cfg(target_os = "macos")]
/// Sets global proxy settings on macOS.
fn set_global_proxy_macos(
    host: &str,
    http_port: u16,
    socks_port: u16,
    bypass_domains: &[&str],
) -> std::io::Result<()> {
    // List all network services
    let output = Command::new("networksetup")
        .arg("-listallnetworkservices")
        .output()?;

    let services = String::from_utf8_lossy(&output.stdout);
    let services: Vec<&str> = services
        .lines()
        .filter(|line| !line.starts_with("*"))
        .collect(); // Exclude disabled services

    for service in services {
        // Enable HTTP Proxy
        Command::new("networksetup")
            .args(&["-setwebproxy", service, host, &http_port.to_string()])
            .status()?;

        // Enable HTTPS Proxy
        Command::new("networksetup")
            .args(&["-setsecurewebproxy", service, host, &http_port.to_string()])
            .status()?;

        // Enable SOCKS Proxy
        Command::new("networksetup")
            .args(&[
                "-setsocksfirewallproxy",
                service,
                host,
                &socks_port.to_string(),
            ])
            .status()?;

        // Enable Proxies
        Command::new("networksetup")
            .args(&["-setwebproxystate", service, "on"])
            .status()?;

        Command::new("networksetup")
            .args(&["-setsecurewebproxystate", service, "on"])
            .status()?;

        Command::new("networksetup")
            .args(&["-setsocksfirewallproxystate", service, "on"])
            .status()?;

        // Set Proxy Bypass Domains
        if !bypass_domains.is_empty() {
            let bypass = bypass_domains.join(",");
            Command::new("networksetup")
                .args(&["-setproxybypassdomains", service, &bypass])
                .status()?;
        }
    }

    Ok(())
}

#[cfg(target_os = "linux")]
/// Sets global proxy settings on Linux (GNOME).
fn set_global_proxy_linux(
    host: &str,
    http_port: u16,
    socks_port: u16,
    bypass_domains: &[&str],
) -> std::io::Result<()> {
    // Set GNOME proxy mode to 'manual'
    Command::new("gsettings")
        .args(&["set", "org.gnome.system.proxy", "mode", "manual"])
        .status()?;

    // Set HTTP Proxy
    Command::new("gsettings")
        .args(&["set", "org.gnome.system.proxy.http", "host", host])
        .status()?;
    Command::new("gsettings")
        .args(&[
            "set",
            "org.gnome.system.proxy.http",
            "port",
            &http_port.to_string(),
        ])
        .status()?;

    // Set HTTPS Proxy
    Command::new("gsettings")
        .args(&["set", "org.gnome.system.proxy.https", "host", host])
        .status()?;
    Command::new("gsettings")
        .args(&[
            "set",
            "org.gnome.system.proxy.https",
            "port",
            &http_port.to_string(),
        ])
        .status()?;

    // Set SOCKS Proxy
    Command::new("gsettings")
        .args(&["set", "org.gnome.system.proxy.socks", "host", host])
        .status()?;
    Command::new("gsettings")
        .args(&[
            "set",
            "org.gnome.system.proxy.socks",
            "port",
            &socks_port.to_string(),
        ])
        .status()?;

    // Set Proxy Bypass Domains
    if !bypass_domains.is_empty() {
        let formatted_domains = bypass_domains
            .iter()
            .map(|d| format!("'{}'", d))
            .collect::<Vec<String>>()
            .join(", ");
        Command::new("gsettings")
            .args(&[
                "set",
                "org.gnome.system.proxy",
                "ignore-hosts",
                &format!["['{}']", formatted_domains],
            ])
            .status()?;
    }

    Ok(())
}

#[cfg(target_os = "windows")]
/// Unsets global proxy settings on Windows.
fn unset_global_proxy_windows() -> std::io::Result<()> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let internet_settings = hkcu.open_subkey_with_flags(
        "Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings",
        KEY_WRITE,
    )?;

    // Disable Proxy
    internet_settings.set_value("ProxyEnable", &0u32)?;

    // Optionally, clear ProxyServer
    internet_settings.delete_value("ProxyServer").ok();

    // Optionally, clear ProxyOverride
    internet_settings.delete_value("ProxyOverride").ok();

    Ok(())
}

#[cfg(target_os = "macos")]
/// Unsets global proxy settings on macOS.
fn unset_global_proxy_macos(bypass_domains: &[&str]) -> std::io::Result<()> {
    // List all network services
    let output = Command::new("networksetup")
        .arg("-listallnetworkservices")
        .output()?;

    let services = String::from_utf8_lossy(&output.stdout);
    let services: Vec<&str> = services
        .lines()
        .filter(|line| !line.starts_with("*"))
        .collect(); // Exclude disabled services

    for service in services {
        // Disable HTTP Proxy
        Command::new("networksetup")
            .args(&["-setwebproxystate", service, "off"])
            .status()?;

        // Disable HTTPS Proxy
        Command::new("networksetup")
            .args(&["-setsecurewebproxystate", service, "off"])
            .status()?;

        // Disable SOCKS Proxy
        Command::new("networksetup")
            .args(&["-setsocksfirewallproxystate", service, "off"])
            .status()?;

        // Clear Proxy Bypass Domains
        if !bypass_domains.is_empty() {
            Command::new("networksetup")
                .args(&["-setproxybypassdomains", service, ""])
                .status()?;
        }
    }

    Ok(())
}

#[cfg(target_os = "linux")]
/// Unsets global proxy settings on Linux (GNOME).
pub fn unset_global_proxy_linux() -> std::io::Result<()> {
    // Set GNOME proxy mode to 'none'
    Command::new("gsettings")
        .args(&["set", "org.gnome.system.proxy", "mode", "none"])
        .status()?;

    // Optionally, reset HTTP Proxy
    Command::new("gsettings")
        .args(&["reset", "org.gnome.system.proxy.http", "host"])
        .status()?;
    Command::new("gsettings")
        .args(&["reset", "org.gnome.system.proxy.http", "port"])
        .status()?;

    // Optionally, reset HTTPS Proxy
    Command::new("gsettings")
        .args(&["reset", "org.gnome.system.proxy.https", "host"])
        .status()?;
    Command::new("gsettings")
        .args(&["reset", "org.gnome.system.proxy.https", "port"])
        .status()?;

    // Optionally, reset SOCKS Proxy
    Command::new("gsettings")
        .args(&["reset", "org.gnome.system.proxy.socks", "host"])
        .status()?;
    Command::new("gsettings")
        .args(&["reset", "org.gnome.system.proxy.socks", "port"])
        .status()?;

    // Clear Proxy Bypass Domains
    Command::new("gsettings")
        .args(&["reset", "org.gnome.system.proxy", "ignore-hosts"])
        .status()?;

    Ok(())
}

#[cfg(target_os = "windows")]
/// Sets PAC proxy settings on Windows.
fn set_pac_proxy_windows(pac_url: &str) -> std::io::Result<()> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let internet_settings = hkcu.open_subkey_with_flags(
        "Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings",
        KEY_WRITE,
    )?;

    // Enable Auto Configuration
    internet_settings.set_value("AutoConfigURL", &pac_url)?;
    internet_settings.set_value("ProxyEnable", &0u32)?;

    Ok(())
}

#[cfg(target_os = "windows")]
/// Unsets PAC proxy settings on Windows.
fn unset_pac_proxy_windows() -> std::io::Result<()> {
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let internet_settings = hkcu.open_subkey_with_flags(
        "Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings",
        KEY_WRITE,
    )?;

    // Disable Auto Configuration
    internet_settings.delete_value("AutoConfigURL").ok();

    Ok(())
}

#[cfg(target_os = "macos")]
/// Sets PAC proxy settings on macOS.
fn set_pac_proxy_macos(pac_url: &str) -> std::io::Result<()> {
    // List all network services
    let output = Command::new("networksetup")
        .arg("-listallnetworkservices")
        .output()?;

    let services = String::from_utf8_lossy(&output.stdout);
    let services: Vec<&str> = services
        .lines()
        .filter(|line| !line.starts_with("*"))
        .collect(); // Exclude disabled services

    for service in services {
        // Set PAC URL
        Command::new("networksetup")
            .args(&["-setautoproxyurl", service, pac_url])
            .status()?;

        // Enable Auto Proxy
        Command::new("networksetup")
            .args(&["-setautoproxystate", service, "on"])
            .status()?;
    }

    Ok(())
}

#[cfg(target_os = "macos")]
/// Unsets PAC proxy settings on macOS.
fn unset_pac_proxy_macos() -> std::io::Result<()> {
    // List all network services
    let output = Command::new("networksetup")
        .arg("-listallnetworkservices")
        .output()?;

    let services = String::from_utf8_lossy(&output.stdout);
    let services: Vec<&str> = services
        .lines()
        .filter(|line| !line.starts_with("*"))
        .collect(); // Exclude disabled services

    for service in services {
        // Disable Auto Proxy
        Command::new("networksetup")
            .args(&["-setautoproxystate", service, "off"])
            .status()?;
    }

    Ok(())
}

#[cfg(target_os = "linux")]
/// Sets PAC proxy settings on Linux (GNOME).
fn set_pac_proxy_linux(pac_url: &str) -> std::io::Result<()> {
    // Set GNOME proxy mode to 'auto'
    Command::new("gsettings")
        .args(&["set", "org.gnome.system.proxy", "mode", "auto"])
        .status()?;

    // Set Auto Proxy URL
    Command::new("gsettings")
        .args(&["set", "org.gnome.system.proxy", "autoconfig-url", pac_url])
        .status()?;

    Ok(())
}

#[cfg(target_os = "linux")]
/// Unsets PAC proxy settings on Linux (GNOME).
fn unset_pac_proxy_linux() -> std::io::Result<()> {
    // Set GNOME proxy mode to 'none'
    Command::new("gsettings")
        .args(&["set", "org.gnome.system.proxy", "mode", "none"])
        .status()?;

    // Optionally, reset Auto Proxy URL
    Command::new("gsettings")
        .args(&["reset", "org.gnome.system.proxy", "autoconfig-url"])
        .status()?;

    Ok(())
}

/// Sets up a PAC file and configures the system to use it based on the operating system.
#[command]
pub async fn setup_pac_proxy(
    app_handle: AppHandle,
    custom_rules: String,
    http_port: u16,
    socks_port: u16,
    state: tauri::State<'_, Mutex<PacServerShutdownHandle>>,
) -> Result<String, String> {
    // 1. Generate the PAC file (like in your existing setup_pac_proxy)
    let gfw_list_text_path = app_handle
        .path()
        .resolve("resources", tauri::path::BaseDirectory::Resource)
        .map_err(|_| "Failed to resolve path".to_string())?
        .join("pac")
        .join("gfwlist.txt");
    let pac_template_path = app_handle
        .path()
        .resolve("resources", tauri::path::BaseDirectory::Resource)
        .map_err(|_| "Failed to resolve path".to_string())?
        .join("pac")
        .join("template.pac");

    let pac_output_path = app_handle
        .path()
        .resolve("proxy.pac", tauri::path::BaseDirectory::AppData)
        .map_err(|_| "expect to resolve proxy.pac path".to_string())?;

    generate_pac_file(
        &custom_rules,
        &gfw_list_text_path.to_string_lossy(),
        &pac_template_path.to_string_lossy(),
        &pac_output_path.to_string_lossy(),
        http_port,
        socks_port,
    )
    .map_err(|e| format!("Failed to generate PAC file: {}", e))?;

    // 2. Start the local PAC server
    let pac_output_path_str = pac_output_path.to_string_lossy().to_string();
    let port = portpicker::pick_unused_port().ok_or("Could not find a free TCP port")?;
    let serve_addr: std::net::SocketAddr = ([127, 0, 0, 1], port).into();

    // Prepare the warp filter to serve the file at /proxy.pac
    let route = warp::path("proxy.pac").and(warp::fs::file(pac_output_path_str));

    // Create a shutdown channel
    let (shutdown_tx, shutdown_rx) = tokio::sync::oneshot::channel::<()>();
    let notify = Arc::new(Notify::new());
    let notify_clone = notify.clone();

    tauri::async_runtime::spawn(async move {
        let (addr, server_future) =
            warp::serve(route).bind_with_graceful_shutdown(serve_addr, async {
                shutdown_rx.await.ok();
            });

        // Indicate that the server is now "starting up" or "running"
        notify_clone.notify_one();

        // Actually start serving
        server_future.await;
    });

    // Wait until the notify is triggered above
    notify.notified().await;

    // Now the server is up and listening
    let pac_url = format!("http://127.0.0.1:{}/proxy.pac", port);
    println!("PAC file is served at: {}", pac_url);

    // 3. Store the shutdown handle in global state (so we can stop later)
    {
        let mut guard = state.lock().unwrap();
        guard.shutdown_tx = Some(shutdown_tx);
    }

    // 4. Now set the OS to use this pac_url
    #[cfg(target_os = "windows")]
    {
        if let Err(e) = set_pac_proxy_windows(&pac_url) {
            return Err(format!("Failed to set PAC proxy on Windows: {}", e));
        }
    }

    #[cfg(target_os = "macos")]
    {
        if let Err(e) = set_pac_proxy_macos(&pac_url) {
            return Err(format!("Failed to set PAC proxy on macOS: {}", e));
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Err(e) = set_pac_proxy_linux(&pac_url) {
            return Err(format!("Failed to set PAC proxy on Linux: {}", e));
        }
    }

    Ok("PAC proxy started and set successfully".into())
}

#[command]
/// Unsets PAC proxy settings based on the operating system.
pub fn unset_pac_proxy(
    state: tauri::State<'_, Mutex<PacServerShutdownHandle>>,
) -> Result<String, String> {
    // 1. Retrieve the shutdown transmitter from the state
    {
        let mut guard = state.lock().unwrap();
        if let Some(tx) = guard.shutdown_tx.take() {
            // Send the shutdown signal to kill the Warp server
            if tx.send(()).is_err() {
                // If we can’t send, the server may have already died
                println!(
                    "PAC server shutdown signal could not be sent (maybe it's already closed)."
                );
            }
        }
    }

    // 2. Unset the PAC on the OS
    #[cfg(target_os = "windows")]
    {
        if let Err(e) = unset_pac_proxy_windows() {
            return Err(format!("Failed to unset PAC proxy on Windows: {}", e));
        }
    }

    #[cfg(target_os = "macos")]
    {
        if let Err(e) = unset_pac_proxy_macos() {
            return Err(format!("Failed to unset PAC proxy on macOS: {}", e));
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Err(e) = unset_pac_proxy_linux() {
            return Err(format!("Failed to unset PAC proxy on Linux: {}", e));
        }
    }

    Ok("PAC proxy server stopped and unset successfully".into())
}

#[command]
/// Sets up global proxy settings based on the operating system.
pub fn setup_global_proxy(
    host: String,
    http_port: u16,
    socks_port: u16,
    bypass_domains: Vec<String>,
) -> Result<String, String> {
    // Determine bypass domains as slice of &str
    let bypass: Vec<&str> = bypass_domains.iter().map(|s| s.as_str()).collect();

    // Set system proxy based on OS
    #[cfg(target_os = "windows")]
    {
        if let Err(e) = set_global_proxy_windows(&host, http_port, socks_port) {
            return Err(format!("Failed to set global proxy on Windows: {}", e));
        }
    }

    #[cfg(target_os = "macos")]
    {
        if let Err(e) = set_global_proxy_macos(&host, http_port, socks_port, &bypass) {
            return Err(format!("Failed to set global proxy on macOS: {}", e));
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Err(e) = set_global_proxy_linux(&host, http_port, socks_port, &bypass) {
            return Err(format!("Failed to set global proxy on Linux: {}", e));
        }
    }

    Ok("Global proxy setup successfully".into())
}

#[command]
/// Unsets global proxy settings based on the operating system.
pub fn unset_global_proxy() -> Result<String, String> {
    // Unset system proxy based on OS
    #[cfg(target_os = "windows")]
    {
        if let Err(e) = unset_global_proxy_windows() {
            return Err(format!("Failed to unset global proxy on Windows: {}", e));
        }
    }

    #[cfg(target_os = "macos")]
    {
        // Assuming bypass domains are cleared when unsetting global proxy
        if let Err(e) = unset_global_proxy_macos(&[]) {
            return Err(format!("Failed to unset global proxy on macOS: {}", e));
        }
    }

    #[cfg(target_os = "linux")]
    {
        if let Err(e) = unset_global_proxy_linux() {
            return Err(format!("Failed to unset global proxy on Linux: {}", e));
        }
    }

    Ok("Global proxy unset successfully".into())
}
