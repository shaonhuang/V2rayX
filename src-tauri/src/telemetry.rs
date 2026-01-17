use axiom_rs::Client as AxiomClient;
use chrono::{DateTime, Utc};
use reqwest::Client as HttpClient;
use serde::{Deserialize, Serialize};
use serde_json::json;
use sha2::{Digest, Sha256};
use std::collections::HashMap;
use std::env;
use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, Mutex, OnceLock};
use std::time::Duration;
use log::{error, info, warn};
use tauri;
use uuid::Uuid;

// Global telemetry client - using Arc directly since AxiomClient is Send + Sync
static AXIOM_CLIENT: OnceLock<Arc<AxiomClient>> = OnceLock::new();
static AXIOM_DATASET: OnceLock<String> = OnceLock::new();
static USAGE_METRICS: OnceLock<Arc<Mutex<UsageMetrics>>> = OnceLock::new();
static CLIENT_IP_CACHE: OnceLock<Arc<Mutex<Option<String>>>> = OnceLock::new();
static DEVICE_ID: OnceLock<Arc<Mutex<Option<String>>>> = OnceLock::new();
static LAST_ACTIVE_DATE: OnceLock<Arc<Mutex<Option<String>>>> = OnceLock::new();

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageMetrics {
    pub uptime_seconds: i64,
    pub proxy_mode: Option<String>,
    pub features_used: Vec<String>,
    pub connection_attempts: u32,
    pub connection_successes: u32,
    pub last_updated: DateTime<Utc>,
}

impl Default for UsageMetrics {
    fn default() -> Self {
        Self {
            uptime_seconds: 0,
            proxy_mode: None,
            features_used: Vec::new(),
            connection_attempts: 0,
            connection_successes: 0,
            last_updated: Utc::now(),
        }
    }
}

pub struct TelemetryConfig {
    pub api_token: String,
    pub dataset: String,
    pub org_id: Option<String>,
}

impl TelemetryConfig {
    pub fn from_env() -> Result<Self, String> {
        // Support VITE_ prefixed variables (for Vite/Tauri) and non-prefixed for backward compatibility
        let api_token = env::var("VITE_AXIOM_API_TOKEN")
            .or_else(|_| env::var("AXIOM_API_TOKEN"))
            .or_else(|_| env::var("AXIOM_TOKEN"))
            .map_err(|_| "VITE_AXIOM_API_TOKEN, AXIOM_API_TOKEN, or AXIOM_TOKEN not set".to_string())?;
        
        let dataset = env::var("VITE_AXIOM_DATASET")
            .or_else(|_| env::var("AXIOM_DATASET"))
            .unwrap_or_else(|_| "v2rayx-usage".to_string());
        
        let org_id = env::var("VITE_AXIOM_ORG_ID")
            .or_else(|_| env::var("AXIOM_ORG_ID"))
            .ok();

        Ok(Self {
            api_token,
            dataset,
            org_id,
        })
    }
}

pub fn init_axiom_client(config: TelemetryConfig) -> Result<(), String> {
    // Build Axiom client using the SDK
    let client = AxiomClient::builder()
        .with_token(&config.api_token)
        .build()
        .map_err(|e| format!("Failed to create Axiom client: {}", e))?;

    let client_arc = Arc::new(client);
    AXIOM_CLIENT
        .set(client_arc)
        .map_err(|_| "Axiom client already initialized".to_string())?;

    // Store dataset name
    AXIOM_DATASET
        .set(config.dataset)
        .map_err(|_| "Axiom dataset already initialized".to_string())?;

    // Initialize usage metrics
    let metrics = Arc::new(Mutex::new(UsageMetrics::default()));
    USAGE_METRICS
        .set(metrics)
        .map_err(|_| "Usage metrics already initialized".to_string())?;

    // Initialize client IP cache
    let ip_cache = Arc::new(Mutex::new(None));
    CLIENT_IP_CACHE
        .set(ip_cache)
        .map_err(|_| "Client IP cache already initialized".to_string())?;

    // Initialize device ID cache
    let device_id = Arc::new(Mutex::new(None));
    DEVICE_ID
        .set(device_id)
        .map_err(|_| "Device ID cache already initialized".to_string())?;

    // Initialize last active date cache
    let last_active_date = Arc::new(Mutex::new(None));
    LAST_ACTIVE_DATE
        .set(last_active_date)
        .map_err(|_| "Last active date cache already initialized".to_string())?;

    info!("Axiom telemetry initialized");
    Ok(())
}

fn get_client() -> Option<Arc<AxiomClient>> {
    AXIOM_CLIENT.get().cloned()
}

fn get_dataset() -> Option<String> {
    AXIOM_DATASET.get().map(|s| s.clone())
}

pub fn is_initialized() -> bool {
    get_client().is_some()
}

fn hash_user_id(user_id: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(user_id.as_bytes());
    format!("{:x}", hasher.finalize())
}

fn get_os() -> String {
    #[cfg(target_os = "macos")]
    return "macos".to_string();
    #[cfg(target_os = "windows")]
    return "windows".to_string();
    #[cfg(target_os = "linux")]
    return "linux".to_string();
    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    return "unknown".to_string();
}

fn get_app_version() -> String {
    // Try to get from environment variable first (set during build)
    env::var("VITE_APP_VERSION")
        .or_else(|_| env::var("CARGO_PKG_VERSION"))
        .unwrap_or_else(|_| "0.5.2".to_string()) // Fallback to version from tauri.conf.json
}

fn get_device_id_file_path() -> Option<PathBuf> {
    // Try to get device ID file path using similar logic as database path
    // This is a fallback that works without AppHandle
    #[cfg(target_os = "macos")]
    {
        if let Ok(home) = env::var("HOME") {
            // Try to find existing app directory first
            let possible_names = vec!["v2rayx", "V2rayX", "v2rayx.shaonhuang"];
            for app_name in &possible_names {
                let mut path = PathBuf::from(&home);
                path.push("Library");
                path.push("Application Support");
                path.push(app_name);
                if path.exists() {
                    path.push("device_id.txt");
                    return Some(path);
                }
            }
            // If no existing directory found, use the first app name
            let mut path = PathBuf::from(&home);
            path.push("Library");
            path.push("Application Support");
            path.push(&possible_names[0]);
            path.push("device_id.txt");
            return Some(path);
        }
    }
    
    #[cfg(target_os = "windows")]
    {
        if let Ok(appdata) = env::var("APPDATA") {
            let app_name = env::var("TAURI_APP_NAME")
                .or_else(|_| env::var("APP_NAME"))
                .unwrap_or_else(|_| "V2rayX".to_string());
            let mut path = PathBuf::from(appdata);
            path.push(&app_name);
            path.push("device_id.txt");
            return Some(path);
        }
    }
    
    #[cfg(target_os = "linux")]
    {
        if let Ok(home) = env::var("HOME") {
            let app_name = env::var("TAURI_APP_NAME")
                .or_else(|_| env::var("APP_NAME"))
                .unwrap_or_else(|_| "V2rayX".to_string());
            let mut path = PathBuf::from(home);
            path.push(".config");
            path.push(&app_name);
            path.push("device_id.txt");
            return Some(path);
        }
    }
    
    None
}

fn get_or_generate_device_id() -> String {
    // Check cache first
    if let Some(device_id_guard) = DEVICE_ID.get() {
        if let Ok(device_id_lock) = device_id_guard.lock() {
            if let Some(ref device_id) = *device_id_lock {
                return device_id.clone();
            }
        }
    }

    // Try to read from file
    if let Some(file_path) = get_device_id_file_path() {
        if file_path.exists() {
            match fs::read_to_string(&file_path) {
                Ok(id) => {
                    let id = id.trim().to_string();
                    if !id.is_empty() && Uuid::parse_str(&id).is_ok() {
                        // Cache it
                        if let Some(device_id_guard) = DEVICE_ID.get() {
                            if let Ok(mut device_id_lock) = device_id_guard.lock() {
                                *device_id_lock = Some(id.clone());
                            }
                        }
                        return id;
                    }
                }
                Err(e) => {
                    warn!("Failed to read device ID file: {}", e);
                }
            }
        }
    }

    // Generate new device ID (using v7 which is time-ordered)
    let new_device_id = Uuid::now_v7().to_string();
    
    // Save to file
    if let Some(file_path) = get_device_id_file_path() {
        // Create parent directory if it doesn't exist
        if let Some(parent) = file_path.parent() {
            if let Err(e) = fs::create_dir_all(parent) {
                warn!("Failed to create device ID directory: {}", e);
            }
        }
        
        if let Err(e) = fs::write(&file_path, &new_device_id) {
            warn!("Failed to write device ID file: {}", e);
        } else {
            info!("Generated and saved new device ID: {}", new_device_id);
        }
    }

    // Cache it
    if let Some(device_id_guard) = DEVICE_ID.get() {
        if let Ok(mut device_id_lock) = device_id_guard.lock() {
            *device_id_lock = Some(new_device_id.clone());
        }
    }

    new_device_id
}

async fn get_client_ip() -> Option<String> {
    // Check cache first
    if let Some(cache) = CLIENT_IP_CACHE.get() {
        if let Ok(cached) = cache.lock() {
            if let Some(ip) = cached.as_ref() {
                return Some(ip.clone());
            }
        }
    }

    // Get public IP address - use a simple service that returns just the IP
    let client = match HttpClient::builder()
        .timeout(Duration::from_secs(5))
        .build()
    {
        Ok(c) => c,
        Err(e) => {
            warn!("Failed to create HTTP client for IP detection: {}", e);
            return None;
        }
    };

    // Try ipify.org first (simple, returns just the IP)
    let ip = match client.get("https://api.ipify.org").send().await {
        Ok(resp) => {
            if resp.status().is_success() {
                match resp.text().await {
                    Ok(ip_text) => {
                        let ip = ip_text.trim().to_string();
                        if !ip.is_empty() {
                            Some(ip)
                        } else {
                            None
                        }
                    }
                    Err(e) => {
                        warn!("Failed to read IP response: {}", e);
                        None
                    }
                }
            } else {
                None
            }
        }
        Err(_) => {
            // Fallback to icanhazip.com
            match client.get("https://icanhazip.com").send().await {
                Ok(resp) => {
                    if resp.status().is_success() {
                        match resp.text().await {
                            Ok(ip_text) => {
                                let ip = ip_text.trim().to_string();
                                if !ip.is_empty() {
                                    Some(ip)
                                } else {
                                    None
                                }
                            }
                            Err(_) => None,
                        }
                    } else {
                        None
                    }
                }
                Err(_) => None,
            }
        }
    };

    // Cache the result if we got one
    if let Some(ref ip_addr) = ip {
        if let Some(cache) = CLIENT_IP_CACHE.get() {
            if let Ok(mut cached) = cache.lock() {
                *cached = Some(ip_addr.clone());
            }
        }
    }

    ip
}

pub async fn send_event(
    event_type: &str,
    user_id: Option<&str>,
    additional_data: Option<serde_json::Value>,
) -> Result<(), String> {
    // Early return if telemetry is not initialized (no warning - this is expected when AXIOM_TOKEN is not set)
    if !is_initialized() {
        return Ok(());
    }

    // Get client Arc and dataset
    let (client_arc, dataset) = {
        let client_arc = match get_client() {
            Some(client) => client,
            None => {
                return Ok(());
            }
        };

        let dataset = match get_dataset() {
            Some(d) => d,
            None => {
                warn!("Axiom dataset not configured");
                return Ok(());
            }
        };

        // Clone the Arc (not the client) - no locks needed since we're using Arc directly
        (client_arc.clone(), dataset)
    };

    // Get client IP address (cached, so only fetched once)
    let client_ip = get_client_ip().await;

    // Get or generate device ID
    let device_id = get_or_generate_device_id();

    // Build event - send raw data including IP and device ID, let Axiom handle geo-location at query time using geo_info_from_ip_address
    let mut event = json!({
        "_time": Utc::now().to_rfc3339(),
        "event_type": event_type,
        "source": "rust",
        "app_version": get_app_version(),
        "os": get_os(),
        "device_id": device_id,
    });

    // Add client IP if available
    if let Some(ip) = client_ip {
        event["client_ip"] = json!(ip);
    }

    if let Some(uid) = user_id {
        event["user_id_hash"] = json!(hash_user_id(uid));
    }

    // Add usage metrics if available (drop lock before await)
    {
        if let Some(metrics_guard) = USAGE_METRICS.get() {
            if let Ok(metrics) = metrics_guard.lock() {
                if metrics.uptime_seconds > 0 {
                    event["uptime_seconds"] = json!(metrics.uptime_seconds);
                }
                if let Some(ref mode) = metrics.proxy_mode {
                    event["proxy_mode"] = json!(mode.clone());
                }
                if !metrics.features_used.is_empty() {
                    event["features_used"] = json!(metrics.features_used.clone());
                }
                if metrics.connection_attempts > 0 {
                    event["connection_attempts"] = json!(metrics.connection_attempts);
                }
                if metrics.connection_successes > 0 {
                    event["connection_successes"] = json!(metrics.connection_successes);
                }
            }
        }
    }

    // Merge additional data
    if let Some(additional) = additional_data {
        if let Some(obj) = event.as_object_mut() {
            if let Some(additional_obj) = additional.as_object() {
                for (key, value) in additional_obj {
                    obj.insert(key.clone(), value.clone());
                }
            }
        }
    }

    // Send to Axiom using SDK
    let events = vec![event];
    match client_arc.ingest(&dataset, events).await {
        Ok(_) => {
            info!("Successfully sent event '{}' to Axiom", event_type);
            Ok(())
        }
        Err(e) => {
            error!("Failed to send event to Axiom: {}", e);
            Err(format!("Failed to send event: {}", e))
        }
    }
}

pub async fn send_error_event(
    error: &dyn std::error::Error,
    user_id: Option<&str>,
    context: Option<HashMap<String, String>>,
) -> Result<(), String> {
    let mut error_data = json!({
        "message": error.to_string(),
    });

    if let Some(ctx) = context {
        error_data["context"] = json!(ctx);
    }

    // Also send to Sentry
    #[cfg(not(debug_assertions))]
    {
        sentry::capture_error(error);
    }

    send_event("error", user_id, Some(error_data)).await
}

pub fn track_feature_usage(feature: &str) {
    if let Some(metrics_guard) = USAGE_METRICS.get() {
        if let Ok(mut metrics) = metrics_guard.lock() {
            if !metrics.features_used.contains(&feature.to_string()) {
                metrics.features_used.push(feature.to_string());
                metrics.last_updated = Utc::now();
            }
        }
    }
}

pub fn track_connection_attempt(success: bool) {
    if let Some(metrics_guard) = USAGE_METRICS.get() {
        if let Ok(mut metrics) = metrics_guard.lock() {
            metrics.connection_attempts += 1;
            if success {
                metrics.connection_successes += 1;
            }
            metrics.last_updated = Utc::now();
        }
    }
}

pub fn update_proxy_mode(mode: &str) {
    if let Some(metrics_guard) = USAGE_METRICS.get() {
        if let Ok(mut metrics) = metrics_guard.lock() {
            metrics.proxy_mode = Some(mode.to_string());
            metrics.last_updated = Utc::now();
        }
    }
}

pub fn update_uptime(uptime_seconds: i64) {
    if let Some(metrics_guard) = USAGE_METRICS.get() {
        if let Ok(mut metrics) = metrics_guard.lock() {
            metrics.uptime_seconds = uptime_seconds;
            metrics.last_updated = Utc::now();
        }
    }
}

/// Track daily active user (DAU) - sends an event when device is active on a new day
pub async fn track_daily_active() -> Result<(), String> {
    if !is_initialized() {
        return Ok(());
    }

    let today = Utc::now().format("%Y-%m-%d").to_string();
    
    // Check if we've already tracked activity for today
    let is_new_day = {
        if let Some(last_active_guard) = LAST_ACTIVE_DATE.get() {
            if let Ok(mut last_active_lock) = last_active_guard.lock() {
                if let Some(ref last_date) = *last_active_lock {
                    if last_date == &today {
                        // Already tracked today
                        return Ok(());
                    }
                }
                // New day - update the date
                *last_active_lock = Some(today.clone());
                true
            } else {
                false
            }
        } else {
            false
        }
    };

    if is_new_day {
        // Send daily active event
        let dau_data = json!({
            "date": today,
            "is_daily_active": true,
        });

        if let Err(e) = send_event("daily_active", None, Some(dau_data)).await {
            warn!("Failed to send daily active event: {}", e);
            return Err(e);
        }

        info!("Tracked daily active user for date: {}", today);
    }

    Ok(())
}

pub async fn send_daily_summary(user_id: Option<&str>) -> Result<(), String> {
    // Clone metrics data and drop lock before await
    let summary = {
        let metrics_guard = USAGE_METRICS.get().ok_or("Usage metrics not initialized")?;
        let metrics = metrics_guard.lock().map_err(|_| "Failed to lock metrics")?;

        // Check if device was active today for DAU tracking
        let today = Utc::now().format("%Y-%m-%d").to_string();
        let is_daily_active = if let Some(last_active_guard) = LAST_ACTIVE_DATE.get() {
            if let Ok(last_active_lock) = last_active_guard.lock() {
                last_active_lock.as_ref().map_or(false, |date| date == &today)
            } else {
                false
            }
        } else {
            false
        };

        json!({
            "uptime_seconds": metrics.uptime_seconds,
            "proxy_mode": metrics.proxy_mode.clone(),
            "features_used": metrics.features_used.clone(),
            "connection_attempts": metrics.connection_attempts,
            "connection_successes": metrics.connection_successes,
            "connection_success_rate": if metrics.connection_attempts > 0 {
                (metrics.connection_successes as f64 / metrics.connection_attempts as f64) * 100.0
            } else {
                0.0
            },
            "is_daily_active": is_daily_active,
            "date": today,
        })
    };

    send_event("daily_summary", user_id, Some(summary)).await
}

pub fn start_daily_summary_task() {
    // This function should be called from within an async runtime context
    // Use tauri::async_runtime::spawn for better compatibility with Tauri
    tauri::async_runtime::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(86400)); // 24 hours
        interval.tick().await; // Skip first tick

        loop {
            interval.tick().await;
            // Only send if telemetry is initialized
            if is_initialized() {
                if let Err(e) = send_daily_summary(None).await {
                    error!("Failed to send daily summary: {}", e);
                }
            }
        }
    });
}
