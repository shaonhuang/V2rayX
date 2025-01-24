create table Endpoints
(
    EndpointID TEXT              not null
        primary key,
    Link       TEXT,
    Remark     TEXT              not null,
    Latency    TEXT,
    GroupName  TEXT              not null,
    GroupID    TEXT              not null,
    Active     integer default 0 not null
);

create table GrpcSettings
(
    EndpointID  text not null,
    ServiceName text
);

create table "Http/2Settings"
(
    EndpointID text               not null,
    Host       integer,
    Path       text default '/'   not null,
    Method     text default 'PUT' not null
);

create table Hysteria2
(
    EndpointID text    not null,
    Address    integer not null,
    Port       integer not null
);

create table Hysteria2Settings
(
    EndpointID    text                not null,
    Password      text                not null,
    Type          text                not null,
    UploadSpeed   int     default 50  not null,
    DownloadSpeed integer default 100 not null,
    EnableUDP     integer default 0   not null
);

create table KcpSettings
(
    EndpointID       text                   not null,
    MTU              integer default 1350   not null,
    TTI              integer default 50     not null,
    UplinkCapacity   integer default 5      not null,
    DownlinkCapacity integer default 20     not null,
    Congestion       integer default 0      not null,
    ReadBufferSize   integer default 2      not null,
    WriteBufferSize  integer default 2      not null,
    HeaderType       text    default 'none' not null
);

create table Outbounds
(
    EndpointID     TEXT                      not null
        primary key
        references Endpoints,
    MuxEnabled     BOOLEAN default false     not null,
    MuxConcurrency INTEGER default 8         not null,
    Protocol       TEXT,
    Tag            TEXT,
    SendThrough    text    default '0.0.0.0' not null,
    check (MuxConcurrency >= 1 AND MuxConcurrency <= 1024)
);

create table QuicSettings
(
    EndpointID text                not null,
    Security   text default 'none' not null,
    Key        text,
    HeaderType text default 'none' not null
);

create table Shadowsocks
(
    EndpointID text              not null
        constraint Shadowsocks_pk
            primary key,
    Email      text,
    Method     text              not null,
    Password   text              not null,
    Level      integer default 0 not null,
    Address    text              not null,
    Port       integer           not null
);

create table StreamSettings
(
    EndpointID TEXT not null
        primary key
        constraint Id
            references Outbounds,
    Security   TEXT not null,
    Network    TEXT not null
);

create table TcpSettings
(
    EndpointID  text                                                                                                                                                                                                                                                                                                                                                                                                                                                      not null,
    HeaderType  text    default 'none'                                                                                                                                                                                                                                                                                                                                                                                                                                    not null,
    RequestPath text,
    RequestHost text,
    Template    integer default '{"version":"1.1","method":"GET","path":[],"headers":{"Host":[],"User-Agent":["Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/53.0.2785.143 Safari/537.36","Mozilla/5.0 (iPhone; CPU iPhone OS 10_0_2 like Mac OS X) AppleWebKit/601.1 (KHTML, like Gecko) CriOS/53.0.2785.109 Mobile/14A456 Safari/601.1.46"],"Accept-Encoding":["gzip, deflate"],"Connection":["keep-alive"],"Pragma":"no-cache"}}' not null
);

create table TlsSettings
(
    EndpointID    TEXT
        primary key,
    AllowInsecure integer default 0 not null,
    ServerName    TEXT,
    FingerPrint   TEXT
);

create table TrojanServers
(
    EndpointID text    not null,
    Address    text    not null,
    Port       integer not null,
    Password   text    not null,
    Email      integer,
    Level      int
);

create table User
(
    UserID   TEXT not null
        constraint UserId
            primary key,
    UserName TEXT not null
        constraint UserName
            unique,
    Password TEXT not null
);

create table AppSettings
(
    UserID                         TEXT                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    not null
        constraint UserId
            primary key
        constraint UserId
            references User,
    AutoLaunch                     integer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 not null,
    AllowSystemNotifications       integer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 not null,
    AutoStartProxy                 integer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 not null,
    DashboardPopWhenStart          integer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 not null,
    AppLogsFolder                  text                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    not null,
    AutoDownloadAndInstallUpgrades integer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 not null,
    Theme                          text                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    not null,
    CustomStyle                    integer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 not null,
    FollowSystemTheme              integer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 not null,
    DarkMode                       integer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 not null,
    Font                           text default 'sans-serif'                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               not null,
    HideTrayBar                    integer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 not null,
    EnhancedTrayIcon               text                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    not null,
    ProxyMode                      text                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    not null,
    BypassDomains                  TEXT default '{"bypass":["127.0.0.1","192.168.0.0/16","10.0.0.0/8","FE80::/64","::1","FD00::/8,","localhost"]}'                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         not null,
    LatencyTestUrl                 text                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    not null,
    LatencyTestTimeout             integer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 not null,
    Language                       text default 'en'                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       not null,
    PAC                            text default '! Demo[01] -------------\n! *.example.com/*\n! > Links will go through proxy:\n! >> https://www.example.com\n! >> https://image.example.com\n! >> https://image.example.com/abcd\n!\n! Demo[02] -------------\n! @@*.example.com/*\n! > Links will NOT go through proxy:\n! >> https://www.example.com\n! >> https://image.example.com\n! >> https://image.example.com/abcd\n!\n! Demo[03] -------------\n! ||example.com\n! > Links will go through proxy:\n! >> http://example.com/abcd\n! >> https://example.com\n! >> ftp://example.com\n!\n! Demo[04] -------------\n! |https://ab\n! > Links will go through proxy:\n! >> https://ab.com\n! >> https://ab.cn\n!\n! ab.com|\n! > Links will go through proxy:\n! >> https://c.ab.com\n! >> https://d.ab.com\n! >> ftp://d.ab.com\n!\n! Demo[05] -------------\n! The line starts with ! is comment.' not null
);

create table Api
(
    UserID text not null
        references AppSettings,
    Tag    text
);

create table AppStatus
(
    ServiceRunningState integer           not null,
    V2rayCoreVersion    TEXT              not null,
    AppVersion          text              not null,
    UserID              text              not null
        constraint UserId
            primary key
        references AppSettings,
    LoginState          integer default 0 not null
);

create table DNS
(
    UserID text                                              not null
        references AppSettings,
    Value  text default '{"hosts":{"dns.google":"8.8.8.8"}}' not null
);

create table EndpointsGroups
(
    GroupID       TEXT
        primary key,
    GroupName     TEXT,
    Remark        TEXT,
    Link          TEXT,
    SpeedTestType TEXT default ping not null,
    UserID        text              not null
        references AppSettings
);

create table Inbounds
(
    Listen      TEXT    not null,
    Port        integer not null,
    Protocol    text    not null,
    Tag         text,
    Strategy    text,
    Refresh     integer,
    Concurrency integer,
    UserID      text    not null
        references AppSettings,
    ID          text    not null
        constraint Id
            primary key,
    constraint Inbounds_userid_port
        unique (UserID, Port),
    constraint Inbounds_userid_tag
        unique (UserID, Tag)
);

create table Log
(
    ErrorPath  text,
    LogLevel   text,
    AccessPath integer,
    UserID     TEXT not null
        references AppSettings
);

create table Policy
(
    UserID text not null
        references AppSettings
);

create table Stats
(
    UserID text not null
        references AppSettings
);

create table VmessVnext
(
    VnextID    TEXT not null
        primary key,
    Address    TEXT,
    Port       INTEGER,
    EndpointID text not null
);

create table VmessUsers
(
    EndpointID text                not null,
    UUID       text                not null,
    AlterID    integer             not null,
    Security   text default 'auto' not null,
    Level      integer,
    VnextID    text                not null
        references VmessVnext
);

create table WsSettings
(
    EndpointID text             not null,
    Host       text             not null,
    Path       text default "/" not null
);
