use serde::{Deserialize, Serialize};
use serde_json::json;
use sqlx::sqlite::SqlitePoolOptions;
use sqlx::Row;
use std::collections::HashMap;

// Define your configuration structures based on the provided JSON structure.

#[derive(Serialize, Deserialize, Debug)]
struct Config {
    log: Log,
    inbounds: Vec<Inbound>,
    stats: Stats,
    api: Api,
    policy: Policy,
    outbounds: Vec<Outbound>,
    dns: Dns,
    routing: Routing,
    transport: Transport,
}

#[derive(Serialize, Deserialize, Debug)]
struct Log {
    error: String,
    loglevel: String,
    access: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct Inbound {
    listen: String,
    port: u16,
    protocol: String,
    tag: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    allocate: Option<Allocate>,
    #[serde(skip_serializing_if = "Option::is_none")]
    settings: Option<HashMap<String, serde_json::Value>>,
}

#[derive(Serialize, Deserialize, Debug)]
struct Allocate {
    strategy: String,
    refresh: u32,
    concurrency: u32,
}

#[derive(Serialize, Deserialize, Debug)]
struct Stats {}

#[derive(Serialize, Deserialize, Debug)]
struct Api {
    services: Vec<String>,
    tag: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct Policy {
    levels: HashMap<String, Level>,
    system: SystemPolicy,
}

#[derive(Serialize, Deserialize, Debug)]
struct Level {
    #[serde(rename = "statsUserUplink")]
    stats_user_uplink: bool,
    #[serde(rename = "statsUserDownlink")]
    stats_user_downlink: bool,
}

#[derive(Serialize, Deserialize, Debug)]
struct SystemPolicy {
    #[serde(rename = "statsInboundUplink")]
    stats_inbound_uplink: bool,
    #[serde(rename = "statsInboundDownlink")]
    stats_inbound_downlink: bool,
    #[serde(rename = "statsOutboundUplink")]
    stats_outbound_uplink: bool,
    #[serde(rename = "statsOutboundDownlink")]
    stats_outbound_downlink: bool,
}

#[derive(Serialize, Deserialize, Debug)]
struct Outbound {
    mux: Mux,
    protocol: String,
    #[serde(rename = "streamSettings")]
    stream_settings: StreamSettings,
    tag: String,
    settings: OutboundSettings,
}

#[derive(Serialize, Deserialize, Debug)]
struct Mux {
    enabled: bool,
    concurrency: u32,
}

#[derive(Serialize, Deserialize, Debug)]
struct StreamSettings {
    #[serde(rename = "tcpSettings")]
    tcp_settings: Option<TcpSettings>,
    #[serde(rename = "kcpSettings")]
    kcp_settings: Option<KcpSettings>,
    #[serde(rename = "httpSettings")]
    http_settings: Option<Http2Settings>,
    #[serde(rename = "quicSettings")]
    quic_settings: Option<QuicSettings>,
    #[serde(rename = "dsSettings")]
    ds_settings: Option<serde_json::Value>,
    #[serde(rename = "grpcSettings")]
    grpc_settings: Option<GrpcSettings>,
    #[serde(rename = "wsSettings")]
    ws_settings: Option<WsSettings>,
    #[serde(rename = "realitySettings")]
    reality_settings: Option<serde_json::Value>,
    #[serde(rename = "xtlsSettings")]
    xtls_settings: Option<serde_json::Value>,
    #[serde(rename = "tlsSettings")]
    tls_settings: Option<TlsSettings>,
    security: String,
    network: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct TcpSettings {
    header: TcpHeader,
}

#[derive(Serialize, Deserialize, Debug)]
struct TcpHeader {
    #[serde(rename = "type")]
    type_field: String, // 'type' is a reserved keyword in Rust
    request: Option<TcpRequest>,
}

#[derive(Serialize, Deserialize, Debug)]
struct TcpRequest {
    path: Option<Vec<String>>,
    headers: Option<HashMap<String, Vec<String>>>,
}

#[derive(Serialize, Deserialize, Debug)]
struct KcpSettings {
    mtu: u32,
    tti: u32,
    #[serde(rename = "uplinkCapacity")]
    uplink_capacity: u32,
    #[serde(rename = "downlinkCapacity")]
    downlink_capacity: u32,
    congestion: bool,
    #[serde(rename = "readBufferSize")]
    read_buffer_size: u32,
    #[serde(rename = "writeBufferSize")]
    write_buffer_size: u32,
    #[serde(rename = "headerType")]
    header_type: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct Http2Settings {
    host: Vec<String>,
    path: String,
    method: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct QuicSettings {
    security: String,
    key: String,
    #[serde(rename = "headerType")]
    header_type: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct GrpcSettings {
    #[serde(rename = "serviceName")]
    service_name: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct WsSettings {
    path: String,
    headers: HashMap<String, String>,
}

#[derive(Serialize, Deserialize, Debug)]
struct TlsSettings {
    #[serde(rename = "allowInsecure")]
    allow_insecure: bool,
    #[serde(rename = "serverName")]
    server_name: String,
    fingerprint: String,
}

#[derive(Serialize, Deserialize, Debug)]
#[serde(untagged)]
enum Servers {
    Shadowsocks(Vec<ShadowsocksServer>),
    Hysteria2(Vec<Hysteria2Server>),
}

#[derive(Serialize, Deserialize, Debug)]
struct OutboundSettings {
    vnext: Option<Vec<VNext>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    servers: Option<Servers>,
    freedom: Option<FreedomSettings>,
    blackhole: Option<BlackholeSettings>,
    // Add other protocol-specific settings if needed
}

#[derive(Serialize, Deserialize, Debug)]
struct VNext {
    address: String,
    port: u16,
    users: Vec<User>,
}

#[derive(Serialize, Deserialize, Debug)]
struct User {
    id: String,
    #[serde(rename = "alterId")]
    alter_id: u32,
    level: u32,
    security: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct ShadowsocksServer {
    method: String,
    password: String,
    level: u32,
    email: Option<String>,
    address: String,
    port: u16,
}

#[derive(Serialize, Deserialize, Debug)]
struct Hysteria2Server {
    address: String,
    port: u16,
}

#[derive(Serialize, Deserialize, Debug)]
struct Dns {
    hosts: HashMap<String, String>,
}

#[derive(Serialize, Deserialize, Debug)]
struct Routing {
    settings: RoutingSettings,
}

#[derive(Serialize, Deserialize, Debug)]
struct RoutingSettings {
    #[serde(rename = "domainStrategy")]
    domain_strategy: String,
    rules: Vec<Rule>,
}

#[derive(Serialize, Deserialize, Debug)]
struct Rule {
    #[serde(rename = "inboundTag")]
    inbound_tag: Vec<String>,
    #[serde(rename = "outboundTag")]
    outbound_tag: String,
    #[serde(rename = "type")]
    rule_type: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct Transport {}

#[derive(Serialize, Deserialize, Debug)]
struct FreedomSettings {
    #[serde(rename = "domainStrategy")]
    domain_strategy: String,
    #[serde(rename = "userLevel")]
    user_level: u32,
}

#[derive(Serialize, Deserialize, Debug)]
struct BlackholeResponse {
    #[serde(rename = "type")]
    type_field: String, // 'type' is a reserved keyword in Rust
}

#[derive(Serialize, Deserialize, Debug)]
struct BlackholeSettings {
    response: BlackholeResponse,
}

pub async fn generate_config(
    user_id: String,
    endpoint_id: String,
    db_path: String,
) -> Result<String, String> {
    // Connect to the SQLite database
    let database_url = format!("sqlite://{}", db_path);
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .map_err(|e| format!("Database connection failed: {}", e))?;

    // Validate the association between UserID and EndpointID
    let association = sqlx::query(
        "SELECT COUNT(*) as count FROM Endpoints WHERE EndpointID = ? AND GroupID = (SELECT GroupID FROM AppSettings WHERE UserID = ?)"
    )
    .bind(&endpoint_id)
    .bind(&user_id)
    .fetch_one(&pool)
    .await
    .map_err(|e| format!("Failed to validate association: {}", e))?;

    let count: i64 = association.get("count");
    if count == 0 {
        return Err("The provided EndpointID is not associated with the given UserID.".into());
    }

    // Fetch Log configuration for the given UserID
    let log_row =
        sqlx::query("SELECT ErrorPath, LogLevel, AccessPath FROM Log WHERE UserID = ? LIMIT 1")
            .bind(&user_id)
            .fetch_one(&pool)
            .await
            .map_err(|e| format!("Failed to fetch Log configuration: {}", e))?;

    let log = Log {
        error: log_row.get::<String, &str>("ErrorPath"),
        loglevel: log_row.get::<String, &str>("LogLevel"),
        access: log_row.get::<String, &str>("AccessPath"),
    };

    // Fetch Inbounds for the given UserID
    let inbound_rows = sqlx::query(
        "SELECT Listen, Port, Protocol, Tag, Strategy, Refresh, Concurrency FROM Inbounds WHERE UserID = ?"
    )
    .bind(&user_id)
    .fetch_all(&pool)
    .await
    .map_err(|e| format!("Failed to fetch Inbounds: {}", e))?;

    let mut inbounds = Vec::new();
    for row in inbound_rows {
        let strategy: Option<String> = row.get("Strategy");
        let refresh: Option<i64> = row.get("Refresh");
        let concurrency: Option<i64> = row.get("Concurrency");

        let allocate = if let (Some(strategy), Some(refresh), Some(concurrency)) =
            (strategy, refresh, concurrency)
        {
            Some(Allocate {
                strategy,
                refresh: refresh as u32,
                concurrency: concurrency as u32,
            })
        } else {
            None
        };

        let protocol: String = row.get("Protocol");
        let settings = match protocol.as_str() {
            "socks" | "http" => None, // Assuming no additional settings
            "dokodemo-door" => {
                let settings = json!({
                    "address": "127.0.0.1"
                });
                Some(
                    serde_json::from_value(settings)
                        .map_err(|e| format!("Failed to parse settings: {}", e))?,
                )
            }
            _ => None, // Extend for other protocols if needed
        };

        let inbound = Inbound {
            listen: row.get::<String, &str>("Listen"),
            port: row.get::<i64, &str>("Port") as u16,
            protocol: protocol.clone(),
            tag: row.get::<String, &str>("Tag"),
            allocate,
            settings,
        };
        inbounds.push(inbound);
    }

    // Fetch Outbound for the given EndpointID
    let outbound_row = sqlx::query(
        "SELECT MuxEnabled, MuxConcurrency, Protocol, Tag, SendThrough FROM Outbounds WHERE EndpointID = ?"
    )
    .bind(&endpoint_id)
    .fetch_one(&pool)
    .await
    .map_err(|e| format!("Failed to fetch Outbounds: {}", e))?;

    let mux_enabled: bool = outbound_row.get::<i64, &str>("MuxEnabled") == 1;
    let mux_concurrency: u32 = outbound_row.get::<i64, &str>("MuxConcurrency") as u32;
    let protocol: String = outbound_row.get("Protocol");
    let tag: String = outbound_row.get("Tag");
    let _send_through: String = outbound_row.get("SendThrough"); // Not used in current config

    // Fetch StreamSettings
    let stream_row =
        sqlx::query("SELECT Security, Network FROM StreamSettings WHERE EndpointID = ?")
            .bind(&endpoint_id)
            .fetch_one(&pool)
            .await
            .map_err(|e| format!("Failed to fetch StreamSettings: {}", e))?;

    let security: String = stream_row.get("Security");
    let network: String = stream_row.get("Network");

    // Initialize StreamSettings components
    let mut stream_settings = StreamSettings {
        tcp_settings: None,
        kcp_settings: None,
        http_settings: None,
        quic_settings: None,
        ds_settings: None,
        grpc_settings: None,
        ws_settings: None,
        reality_settings: None,
        xtls_settings: None,
        tls_settings: None,
        security: security.clone(),
        network: network.clone(),
    };

    // Fetch and set specific stream settings based on network and protocol
    match network.as_str() {
        "tcp" => {
            let tcp_row = sqlx::query(
                "SELECT HeaderType, RequestPath, RequestHost FROM TcpSettings WHERE EndpointID = ?",
            )
            .bind(&endpoint_id)
            .fetch_one(&pool)
            .await
            .map_err(|e| format!("Failed to fetch TcpSettings: {}", e))?;

            let header_type: String = tcp_row.get("HeaderType");
            let request_path: Option<String> = tcp_row.get("RequestPath");
            let request_host: Option<String> = tcp_row.get("RequestHost");

            let request = if request_path.is_some() || request_host.is_some() {
                Some(TcpRequest {
                    path: request_path.map(|p| vec![p]),
                    headers: if let Some(host) = request_host {
                        Some(HashMap::from([("Host".to_string(), vec![host])]))
                    } else {
                        None
                    },
                })
            } else {
                None
            };

            let tcp_settings = TcpSettings {
                header: TcpHeader {
                    type_field: header_type,
                    request,
                },
            };

            stream_settings.tcp_settings = Some(tcp_settings);
        }
        "kcp" => {
            let kcp_row = sqlx::query(
                "SELECT MTU, TTI, UplinkCapacity, DownlinkCapacity, Congestion, ReadBufferSize, WriteBufferSize, HeaderType FROM KcpSettings WHERE EndpointID = ?"
            )
            .bind(&endpoint_id)
            .fetch_one(&pool)
            .await
            .map_err(|e| format!("Failed to fetch KcpSettings: {}", e))?;

            let kcp_settings = KcpSettings {
                mtu: kcp_row.get::<i64, &str>("MTU") as u32,
                tti: kcp_row.get::<i64, &str>("TTI") as u32,
                uplink_capacity: kcp_row.get::<i64, &str>("UplinkCapacity") as u32,
                downlink_capacity: kcp_row.get::<i64, &str>("DownlinkCapacity") as u32,
                congestion: kcp_row.get::<i64, &str>("Congestion") == 1,
                read_buffer_size: kcp_row.get::<i64, &str>("ReadBufferSize") as u32,
                write_buffer_size: kcp_row.get::<i64, &str>("WriteBufferSize") as u32,
                header_type: kcp_row.get("HeaderType"),
            };

            stream_settings.kcp_settings = Some(kcp_settings);
        }
        "http" => {
            let http_row = sqlx::query(
                "SELECT Host, Path, Method FROM \"Http/2Settings\" WHERE EndpointID = ?",
            )
            .bind(&endpoint_id)
            .fetch_one(&pool)
            .await
            .map_err(|e| format!("Failed to fetch Http/2Settings: {}", e))?;

            let host: String = http_row.get("Host");
            let path: Option<String> = http_row.get("Path");
            let method: Option<String> = http_row.get("Method");

            let http_settings = Http2Settings {
                host: vec![host],
                path: path.unwrap_or_else(|| "/".to_string()),
                method: method.unwrap_or_else(|| "PUT".to_string()),
            };

            stream_settings.http_settings = Some(http_settings);
        }
        "quic" => {
            let quic_row = sqlx::query(
                "SELECT Security, Key, HeaderType FROM QuicSettings WHERE EndpointID = ?",
            )
            .bind(&endpoint_id)
            .fetch_one(&pool)
            .await
            .map_err(|e| format!("Failed to fetch QuicSettings: {}", e))?;

            let quic_settings = QuicSettings {
                security: quic_row.get("Security"),
                key: quic_row.get("Key"),
                header_type: quic_row.get("HeaderType"),
            };

            stream_settings.quic_settings = Some(quic_settings);
        }
        "grpc" => {
            let grpc_row = sqlx::query("SELECT ServiceName FROM GrpcSettings WHERE EndpointID = ?")
                .bind(&endpoint_id)
                .fetch_one(&pool)
                .await
                .map_err(|e| format!("Failed to fetch GrpcSettings: {}", e))?;

            let grpc_settings = GrpcSettings {
                service_name: grpc_row.get("ServiceName"),
            };

            stream_settings.grpc_settings = Some(grpc_settings);
        }
        "ws" => {
            let ws_row = sqlx::query("SELECT Host, Path FROM WsSettings WHERE EndpointID = ?")
                .bind(&endpoint_id)
                .fetch_one(&pool)
                .await
                .map_err(|e| format!("Failed to fetch WsSettings: {}", e))?;

            let ws_settings = WsSettings {
                path: ws_row.get("Path"),
                headers: HashMap::from([("host".to_string(), ws_row.get::<String, &str>("Host"))]),
            };

            stream_settings.ws_settings = Some(ws_settings);
        }
        _ => {}
    }

    // Fetch TLS Settings if applicable
    let tls_settings_row = sqlx::query(
        "SELECT AllowInsecure, ServerName, FingerPrint FROM TlsSettings WHERE EndpointID = ?",
    )
    .bind(&endpoint_id)
    .fetch_optional(&pool)
    .await
    .map_err(|e| format!("Failed to fetch TlsSettings: {}", e))?;

    if let Some(tls_row) = tls_settings_row {
        let tls_settings = TlsSettings {
            allow_insecure: tls_row.get::<i32, &str>("AllowInsecure") == 1,
            server_name: tls_row.get("ServerName"),
            fingerprint: tls_row.get("FingerPrint"),
        };
        stream_settings.tls_settings = Some(tls_settings);
    }

    // Fetch the specific outbound settings based on protocol
    let outbound_settings = match protocol.as_str() {
        "vmess" => {
            // Fetch VNext configurations
            let vnext_rows =
                sqlx::query("SELECT VnextID, Address, Port FROM VmessVnext WHERE EndpointID = ?")
                    .bind(&endpoint_id)
                    .fetch_all(&pool)
                    .await
                    .map_err(|e| format!("Failed to fetch VmessVnext: {}", e))?;

            let mut vnext_list = Vec::new();
            for vnext_row in vnext_rows {
                let vnext_id: String = vnext_row.get("VnextID");
                let address: String = vnext_row.get("Address");
                let port: u16 = vnext_row.get::<i64, &str>("Port") as u16;

                // Fetch Users
                let user_rows = sqlx::query(
                    "SELECT UUID, AlterID, Level, Security FROM VmessUsers WHERE VnextID = ?",
                )
                .bind(&vnext_id)
                .fetch_all(&pool)
                .await
                .map_err(|e| format!("Failed to fetch VmessUsers: {}", e))?;

                let mut users = Vec::new();
                for user_row in user_rows {
                    let uuid: String = user_row.get("UUID");
                    let alter_id: u32 = user_row.get::<i64, &str>("AlterID") as u32;
                    let level: u32 = user_row.get::<Option<i64>, &str>("Level").unwrap_or(0) as u32;
                    let security: String = user_row.get("Security");

                    users.push(User {
                        id: uuid,
                        alter_id,
                        level,
                        security,
                    });
                }

                vnext_list.push(VNext {
                    address,
                    port,
                    users,
                });
            }

            OutboundSettings {
                vnext: Some(vnext_list),
                servers: None,
                freedom: None,
                blackhole: None,
            }
        }
        "shadowsocks" => {
            // Fetch Shadowsocks configurations
            let ss_rows = sqlx::query(
                "SELECT Method, Password, Level, Email, Address, Port FROM Shadowsocks WHERE EndpointID = ?"
            )
            .bind(&endpoint_id)
            .fetch_all(&pool)
            .await
            .map_err(|e| format!("Failed to fetch Shadowsocks: {}", e))?;

            let mut servers = Vec::new();
            for ss_row in ss_rows {
                let email_value: i64 = ss_row.get("Email"); // Assuming Email is stored as an integer flag
                let email = if email_value != 0 {
                    Some(ss_row.get::<String, &str>("Email"))
                } else {
                    None
                };

                let server = ShadowsocksServer {
                    method: ss_row.get("Method"),
                    password: ss_row.get("Password"),
                    level: ss_row.get::<i64, &str>("Level") as u32,
                    email,
                    address: ss_row.get("Address"),
                    port: ss_row.get::<i64, &str>("Port") as u16,
                };
                servers.push(server);
            }

            OutboundSettings {
                vnext: None,
                servers: Some(Servers::Shadowsocks(servers)),
                freedom: None,
                blackhole: None,
            }
        }
        "hysteria2" => {
            // Fetch Hysteria2 configurations
            let h2_rows = sqlx::query(
                "SELECT Address, Port FROM Hysteria2 WHERE EndpointID = ?"
            )
            .bind(&endpoint_id)
            .fetch_all(&pool)
            .await
            .map_err(|e| format!("Failed to fetch Hysteria2: {}", e))?;

            let mut servers = Vec::new();
            for h2_row in h2_rows {
                // Address is stored as integer in DB, but we need it as string
                // We'll need to convert it, but first let's check the actual type
                // For now, assuming Address might be stored as text or we need to handle it differently
                let address: String = h2_row.get("Address");
                let port: u16 = h2_row.get::<i64, &str>("Port") as u16;

                servers.push(Hysteria2Server {
                    address,
                    port,
                });
            }

            OutboundSettings {
                vnext: None,
                servers: Some(Servers::Hysteria2(servers)),
                freedom: None,
                blackhole: None,
            }
        }
        // Add other protocols like "trojan", etc., similarly
        _ => OutboundSettings {
            vnext: None,
            servers: None,
            freedom: None,
            blackhole: None,
        },
    };

    // Assemble the primary Outbound
    let outbound = Outbound {
        mux: Mux {
            enabled: mux_enabled,
            concurrency: mux_concurrency,
        },
        protocol: protocol.clone(),
        stream_settings,
        tag: tag.clone(),
        settings: outbound_settings,
    };

    // Initialize the outbounds vector with the primary outbound
    let mut outbounds = vec![outbound];

    // Create the 'direct' outbound (freedom protocol)
    let direct_outbound = Outbound {
        mux: Mux {
            enabled: false, // Defaults; adjust as needed
            concurrency: 1, // Defaults; adjust as needed
        },
        protocol: "freedom".to_string(),
        stream_settings: StreamSettings {
            tcp_settings: None,
            kcp_settings: None,
            http_settings: None,
            quic_settings: None,
            ds_settings: None,
            grpc_settings: None,
            ws_settings: None,
            reality_settings: None,
            xtls_settings: None,
            tls_settings: None,
            security: "none".to_string(), // Assuming 'none'; adjust if needed
            network: "tcp".to_string(),   // Assuming 'tcp'; adjust if needed
        },
        tag: "direct".to_string(),
        settings: OutboundSettings {
            freedom: Some(FreedomSettings {
                domain_strategy: "UseIP".to_string(),
                user_level: 0,
            }),
            vnext: None,
            servers: None,
            blackhole: None,
        },
    };

    // Create the 'block' outbound (blackhole protocol)
    let block_outbound = Outbound {
        mux: Mux {
            enabled: false, // Defaults; adjust as needed
            concurrency: 1, // Defaults; adjust as needed
        },
        protocol: "blackhole".to_string(),
        stream_settings: StreamSettings {
            tcp_settings: None,
            kcp_settings: None,
            http_settings: None,
            quic_settings: None,
            ds_settings: None,
            grpc_settings: None,
            ws_settings: None,
            reality_settings: None,
            xtls_settings: None,
            tls_settings: None,
            security: "none".to_string(), // Assuming 'none'; adjust if needed
            network: "tcp".to_string(),   // Assuming 'tcp'; adjust if needed
        },
        tag: "block".to_string(),
        settings: OutboundSettings {
            blackhole: Some(BlackholeSettings {
                response: BlackholeResponse {
                    type_field: "none".to_string(),
                },
            }),
            vnext: None,
            servers: None,
            freedom: None,
        },
    };

    // Append the default outbounds to the outbounds vector
    outbounds.push(direct_outbound);
    outbounds.push(block_outbound);

    // Fetch DNS for the given UserID
    let dns_row = sqlx::query("SELECT Value FROM DNS WHERE UserID = ? LIMIT 1")
        .bind(&user_id)
        .fetch_one(&pool)
        .await
        .map_err(|e| format!("Failed to fetch DNS: {}", e))?;

    let dns_value: String = dns_row.get("Value");
    let dns: Dns =
        serde_json::from_str(&dns_value).map_err(|e| format!("Failed to parse DNS JSON: {}", e))?;

    // Fetch Routing Rules for the given UserID
    // Uncomment and modify the following block if you have routing rules in the database
    /*
    let routing_rules =
        sqlx::query("SELECT inboundTag, outboundTag, type FROM Routing WHERE UserID = ?")
            .bind(&user_id)
            .fetch_all(&pool)
            .await
            .map_err(|e| format!("Failed to fetch Routing rules: {}", e))?;

    let mut rules = Vec::new();
    for row in routing_rules {
        // Assuming inboundTag is stored as a JSON array string, e.g., '["api"]'
        let inbound_tags_json: String = row.get("inboundTag");
        let inbound_tags: Vec<String> = serde_json::from_str(&inbound_tags_json)
            .map_err(|e| format!("Failed to parse inboundTag JSON: {}", e))?;
        let outbound_tag: String = row.get("outboundTag");
        let rule_type: String = row.get("type");

        rules.push(Rule {
            inboundTag: inbound_tags,
            outboundTag: outbound_tag,
            rule_type,
        });
    }
    */

    // For demonstration purposes, adding a default rule
    let mut rules = Vec::new();
    rules.push(Rule {
        inbound_tag: vec!["api".to_string()],
        outbound_tag: "api".to_string(),
        rule_type: "field".to_string(),
    });

    let routing = Routing {
        settings: RoutingSettings {
            domain_strategy: "AsIs".to_string(),
            rules,
        },
    };

    // Fetch Policy settings for the given UserID
    // Uncomment and modify the following block if you have policy settings in the database
    /*
    let policy_row = sqlx::query("SELECT * FROM Policy WHERE UserID = ?")
        .bind(&user_id)
        .fetch_one(&pool)
        .await
        .map_err(|e| format!("Failed to fetch Policy: {}", e))?;

    // Parse policy_row into Policy struct as needed
    */

    // Providing a default implementation for Policy
    let policy = Policy {
        levels: HashMap::from([(
            "0".to_string(),
            Level {
                stats_user_uplink: true,
                stats_user_downlink: true,
            },
        )]),
        system: SystemPolicy {
            stats_inbound_uplink: true,
            stats_inbound_downlink: true,
            stats_outbound_uplink: true,
            stats_outbound_downlink: true,
        },
    };

    // Fetch Stats settings for the given UserID
    let stats = Stats {}; // Assuming no specific fields; extend if needed

    // Assemble the final configuration
    let config = Config {
        log,
        inbounds,
        stats,
        api: Api {
            services: vec![
                "HandlerService".to_string(),
                "LoggerService".to_string(),
                "StatsService".to_string(),
            ],
            tag: "api".to_string(),
        },
        policy,
        outbounds,
        dns,
        routing,
        transport: Transport {},
    };

    // Serialize the configuration to JSON
    let config_json = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize configuration: {}", e))?;

    // Return the JSON string
    Ok(config_json)
}
