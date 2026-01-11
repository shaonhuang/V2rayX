import Database from '@tauri-apps/plugin-sql';
import { v7 as uuid } from 'uuid';
import { encode } from 'js-base64';
import * as Types from './types';
import { appLogDir } from '@tauri-apps/api/path';
import * as yaml from 'js-yaml';
import _ from 'lodash';
import * as path from '@tauri-apps/api/path';
import CryptoJS from 'crypto-js';
import {
  enable as autoStartEnable,
  isEnabled as autoStartIsEnabled,
  disable as autoStartDisable,
} from '@tauri-apps/plugin-autostart';
export const V2RAY_CORE_VERSION: string = import.meta.env
  .VITE_V2RAY_CORE_VERSION;
export const APP_VERSION: string = import.meta.env.VITE_APP_VERSION;
export const UPDATER_ACTIVE: boolean =
  import.meta.env.VITE_UPDATER_ACTIVE === 'true';

const initDb = async (maxRetries = 5, retryDelay = 1000) => {
  return await Database.load('sqlite:database.db');
};

// Generate a random 16-byte salt as a hex string
const generateSalt = (): string => {
  const randomBytes = CryptoJS.lib.WordArray.random(16);
  return randomBytes.toString(CryptoJS.enc.Hex);
};

// Hash a password with a salt using PBKDF2
const hashPassword = (password: string, salt: string): string => {
  // Use PBKDF2 with 10000 iterations and SHA-256
  const key = CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: 10000,
    hasher: CryptoJS.algo.SHA256,
  });

  return key.toString(CryptoJS.enc.Hex);
};

export const testApi = async () => {
  const db = await initDb();
  return await db.select('SELECT * FROM User');
};

export const register = async (props: {
  username: string;
  password: string;
}) => {
  const { username, password } = props;
  const db = await initDb();
  const appLogFolder = await appLogDir();
  const bypassYaml = `
bypass:
  - 127.0.0.1
  - 192.168.0.0/16
  - 10.0.0.0/8
  - FE80::/64
  - ::1
  - FD00::/8,
  - localhost
`;
  const bypassObj = yaml.load(bypassYaml);
  const userID = uuid();

  // Generate a salt and hash the password
  const salt = generateSalt();
  const hashedPassword = hashPassword(password, salt);

  // Insert user information with salt and hashed password
  await db.execute(
    `
      INSERT INTO User (UserID, UserName, Password, Salt) VALUES (?, ?, ?, ?)
    `,
    [userID, username, hashedPassword, salt],
  );

  const appSettingsDefaults = {
    UserID: userID,
    AutoLaunch: await autoStartIsEnabled(),
    AllowSystemNotifications: 1,
    AutoStartProxy: 0,
    DashboardPopWhenStart: 1,
    AppLogsFolder: appLogFolder,
    AutoDownloadAndInstallUpgrades: 1,
    Theme: 'light',
    CustomStyle: 0,
    FollowSystemTheme: 1,
    DarkMode: 0,
    Font: 'sans-serif',
    HideTrayBar: 0,
    EnhancedTrayIcon: '',
    ProxyMode: 'manual',
    BypassDomains: JSON.stringify(bypassObj),
    LatencyTestUrl: 'http://www.gstatic.com/generate_204',
    LatencyTestTimeout: 3000,
  };

  await db.execute(
    `
      INSERT INTO AppSettings (
        UserID, AutoLaunch, AllowSystemNotifications, AutoStartProxy,
        DashboardPopWhenStart, AppLogsFolder,
        AutoDownloadAndInstallUpgrades, Theme, CustomStyle,
        FollowSystemTheme, DarkMode, Font, HideTrayBar,
        EnhancedTrayIcon, ProxyMode, BypassDomains,
        LatencyTestUrl, LatencyTestTimeout
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    Object.values(appSettingsDefaults),
  );

  // Default settings for AppStatus
  const appStatusDefaults = {
    ServiceRunningState: 0,
    V2rayCoreVersion: V2RAY_CORE_VERSION,
    AppVersion: APP_VERSION,
    UserID: userID,
  };

  await db.execute(
    `
      INSERT INTO AppStatus (
        ServiceRunningState, V2rayCoreVersion, AppVersion, UserID
      )
      VALUES (?, ?, ?, ?)
    `,
    Object.values(appStatusDefaults),
  );

  // Default settings for Inbounds
  const inboundsDefaults = [
    {
      ID: uuid(),
      Listen: '127.0.0.1',
      Port: 10871,
      Protocol: 'http',
      Tag: 'http-inbound',
      Strategy: 'always',
      Refresh: 5,
      Concurrency: 3,
      UserID: userID,
    },
    {
      ID: uuid(),
      Listen: '127.0.0.1',
      Port: 10801,
      Protocol: 'socks',
      Tag: 'socks-inbound',
      Strategy: 'always',
      Refresh: 5,
      Concurrency: 3,
      UserID: userID,
    },
    {
      ID: uuid(),
      Listen: '127.0.0.1',
      Port: 10805,
      Protocol: 'dokodemo-door',
      Tag: 'api',
      Strategy: 'always',
      Refresh: 5,
      Concurrency: 3,
      UserID: userID,
    },
  ];

  inboundsDefaults.forEach(async (inbound) => {
    await db.execute(
      `
        INSERT INTO Inbounds (
          ID, Listen, Port, Protocol, Tag, Strategy, Refresh, Concurrency, UserID
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      Object.values(inbound),
    );
  });

  await db.execute(
    `
      INSERT INTO DNS (
        UserID
      )
      VALUES (?)
    `,
    [userID],
  );

  await db.execute(
    `
		INSERT INTO Log (
		UserID, ErrorPath, AccessPath, LogLevel
		) VALUES (?, ?, ?, ?);
		`,
    [
      userID,
      await path.join(appLogFolder, 'error.log'),
      await path.join(appLogFolder, 'access.log'),
      'info',
    ],
  );
};

export const login = async (props: { username: string; password: string }) => {
  const { username, password } = props;
  const db = await initDb();

  // First, get the user record to retrieve the salt
  const userRecords = await db.select<Array<Types.User>>(
    `SELECT * FROM User WHERE UserName = ?`,
    [username],
  );

  // If no user found, return empty array (authentication failed)
  if (userRecords.length === 0) {
    return [];
  }

  const userRecord = userRecords[0];
  const salt = userRecord.Salt;

  // Hash the input password with the stored salt
  const hashedPassword = hashPassword(password, salt);

  // Check if the hashed password matches the stored one
  if (hashedPassword === userRecord.Password) {
    // Return user info without the salt for security
    return [userRecord];
  }

  // If password doesn't match, return empty array (authentication failed)
  return [];
};

export const updateAppStatus = async (props: {
  userID: string;
  data: Partial<Types.AppStatus>;
}) => {
  const db = await initDb();
  const { data, userID } = props;

  // Filter out undefined keys and prepare parts for SQL statement
  const entries = Object.entries(data).filter(
    ([, value]) => value !== undefined,
  );
  if (entries.length === 0) return; // Exit if no data to update

  // Prepare SQL query parts
  const sqlSetParts = entries.map(([key]) => `${key} = ?`).join(', ');
  const sqlValues = entries.map(([, value]) => value);

  // Complete SQL query
  const sqlQuery = `UPDATE AppStatus SET ${sqlSetParts} WHERE UserID = ?`;

  // Execute the update query
  await db.execute(sqlQuery, [...sqlValues, userID]);
};

export const queryUser = async (props: { userID: string }) => {
  const { userID } = props;
  const db = await initDb();
  return await db.select<Types.User[]>('SELECT * FROM User WHERE UserID = ?', [
    userID,
  ]);
};

export const queryDashboard = async (props: {
  userID: string;
}): Promise<Types.DashboardData> => {
  const { userID } = props;
  const db = await initDb();
  const results = await db.select<
    {
      Listen: string;
      Protocol: string;
      Port: string;
      AutoLaunch: number;
      ProxyMode: string;
      V2rayCoreVersion: string;
    }[]
  >(
    `
    SELECT
      i.Listen, i.Protocol, i.Port,
      a.AutoLaunch, a.ProxyMode,
      s.V2rayCoreVersion
    FROM Inbounds i
    JOIN AppSettings a ON i.UserID = a.UserID
    JOIN AppStatus s ON i.UserID = s.UserID
    WHERE i.UserID = ?
  `,
    [userID],
  );

  const groupedByProtocol = _.groupBy(results, 'Protocol');
  const autoLaunch = results[0]?.AutoLaunch === 1;
  const proxyMode = results[0]?.ProxyMode;
  const v2rayCoreVersion = results[0]?.V2rayCoreVersion;
  const AutoDownloadAndInstallUpgrades: number = (
    await db.select<Types.AppSettings[]>(
      'SELECT * FROM AppSettings WHERE UserID = ?',
      [userID],
    )
  )[0].AutoDownloadAndInstallUpgrades;

  return {
    http:
      groupedByProtocol['http']?.map((p) => ({
        listen: p.Listen,
        port: p.Port,
      })) || [],
    socks:
      groupedByProtocol['socks']?.map((p) => ({
        listen: p.Listen,
        port: p.Port,
      })) || [],
    autoLaunch,
    proxyMode,
    v2rayCoreVersion,
    autoCheckUpdate: AutoDownloadAndInstallUpgrades === 1,
  };
};

export const updateAutoLaunch = async (props: {
  userID: string;
  autoLaunch: boolean;
}) => {
  const db = await initDb();
  await (props.autoLaunch ? autoStartEnable() : autoStartDisable());
  await db.execute('UPDATE AppSettings SET AutoLaunch = ? WHERE UserID = ?', [
    props.autoLaunch ? 1 : 0,
    props.userID,
  ]);
};

export const updateProxyMode = async (props: {
  userID: string;
  proxyMode: string;
}) => {
  const db = await initDb();
  await db.execute('UPDATE AppSettings SET ProxyMode = ? WHERE UserID = ?', [
    props.proxyMode,
    props.userID,
  ]);
};

export const queryAppStatus = async (props: {
  userID: string;
}): Promise<Types.AppStatus[]> => {
  const db = await initDb();
  return await db.select<Types.AppStatus[]>(
    'SELECT * FROM AppStatus WHERE UserID = ?',
    [props.userID],
  );
};

export const queryGeneralSettings = async (props: {
  userID: string;
}): Promise<Types.GeneralSettings> => {
  const db = await initDb();
  const res = await db.select<Types.AppSettings[]>(
    'SELECT * FROM AppSettings WHERE UserID = ?',
    [props.userID],
  );
  const logRes = await db.select<Types.Log[]>(
    'SELECT * FROM Log WHERE UserID = ?',
    [props.userID],
  );
  return {
    autoStartProxy: res[0].AutoStartProxy === 1,
    allowSystemNotifications: res[0].AllowSystemNotifications === 1,
    dashboardPopWhenStart: res[0].DashboardPopWhenStart === 1,
    applicationLogsFolder: res[0].AppLogsFolder,
    v2rayLogLevel: logRes[0].LogLevel,
    v2rayAccessLogsPath: logRes[0].AccessPath ?? '',
    v2rayErrorLogsPath: logRes[0].ErrorPath ?? '',
    language: res[0].Language,
  };
};

export const updateGeneralSettings = async (props: {
  userID: string;
  general: Types.GeneralSettings;
}) => {
  const db = await initDb();
  await db.execute(
    'UPDATE AppSettings SET AutoStartProxy = ?,  AllowSystemNotifications = ?, DashboardPopWhenStart = ?, AppLogsFolder = ?, Language = ? WHERE UserID = ?',
    [
      props.general.autoStartProxy ? 1 : 0,
      props.general.allowSystemNotifications ? 1 : 0,
      props.general.dashboardPopWhenStart ? 1 : 0,
      props.general.applicationLogsFolder,
      props.general.language,
      props.userID,
    ],
  );
  await db.execute('UPDATE Log SET LogLevel = ? WHERE UserID = ?', [
    props.general.v2rayLogLevel,
    props.userID,
  ]);
};

export const queryAppearance = async (props: {
  userID: string;
}): Promise<{
  theme: 'dark' | 'light' | 'system';
  font: string;
  hideTrayBar: boolean;
}> => {
  const db = await initDb();
  const res = await db.select<
    {
      HideTrayBar: number;
      Font: string;
      DarkMode: number;
      FollowSystemTheme: number;
    }[]
  >('SELECT * FROM AppSettings WHERE UserID = ?', [props.userID]);
  if (!res.length) {
    return {
      theme: 'light',
      font: 'sans-serif',
      hideTrayBar: false,
    };
  }
  return {
    theme:
      res[0].FollowSystemTheme === 1
        ? 'system'
        : res[0].DarkMode === 1
          ? 'dark'
          : 'light',
    font: res[0].Font,
    hideTrayBar: res[0].HideTrayBar === 1,
  };
};

export const updateAppearance = async (props: {
  userID: string;
  appearance: Types.Appearance;
}) => {
  const appearance = props.appearance;
  const db = await initDb();
  await db.execute(
    'UPDATE AppSettings SET DarkMode = ?, FollowSystemTheme = ?, HideTrayBar = ?, Font = ? WHERE UserID = ?',
    [
      appearance.theme === 'dark' ? 1 : 0,
      appearance.theme === 'system' ? 1 : 0,
      appearance.hideTrayBar ? 1 : 0,
      appearance.font,
      props.userID,
    ],
  );
};

export const queryInboundsSettings = async (props: {
  userID: string;
}): Promise<Types.Inbound[]> => {
  const db = await initDb();
  const res = (await db.select('SELECT * FROM Inbounds WHERE UserID = ?', [
    props.userID,
  ])) as Types.Inbound[];
  return res;
};

export const updateInbounds = async (props: {
  userID: string;
  inbounds: Partial<Types.Inbound>[];
}) => {
  const db = await initDb();

  for (const inbound of props.inbounds) {
    // Validate that ID exists
    if (!inbound.ID) {
      console.error(
        'updateInbounds: ID is required but was not provided',
        inbound,
      );
      throw new Error('ID is required for updating inbounds');
    }

    // Check if the record exists
    const existing = (await db.select(
      'SELECT * FROM Inbounds WHERE UserID = ? AND ID = ?',
      [props.userID, inbound.ID],
    )) as Types.Inbound[];

    if (existing.length === 0) {
      console.error(
        `updateInbounds: No record found for UserID=${props.userID}, ID=${inbound.ID}`,
      );
      throw new Error(
        `Inbound with ID ${inbound.ID} not found for user ${props.userID}`,
      );
    }

    // Construct the SQL query dynamically based on provided fields
    const entries = Object.entries(inbound).filter(
      ([key]) => key !== 'UserID' && key !== 'ID',
    );
    if (entries.length === 0) {
      console.warn(
        'updateInbounds: No fields to update for inbound',
        inbound.ID,
      );
      continue; // Skip if no fields to update
    }

    const setClause = entries.map(([key]) => `${key} = ?`).join(', ');
    const values = entries.map(([_, value]) => value);

    const query = `UPDATE Inbounds SET ${setClause} WHERE UserID = ? AND ID = ?`;
    const params = [...values, props.userID, inbound.ID];

    console.log('updateInbounds: Executing query:', query);
    console.log('updateInbounds: With params:', params);

    try {
      await db.execute(query, params);
      console.log('updateInbounds: Successfully updated inbound', inbound.ID);
    } catch (error) {
      console.error(
        'updateInbounds: Error updating inbound',
        inbound.ID,
        error,
      );
      throw error;
    }
  }
};

export const queryDNS = async (props: {
  userID: string;
}): Promise<Types.DNS> => {
  const db = await initDb();
  const res = (await db.select('SELECT * FROM DNS WHERE UserID = ?', [
    props.userID,
  ])) as Types.DNS[];
  return res[0];
};

export const updateDNS = async (props: { userID: string; dns: string }) => {
  const db = await initDb();
  const dns = props.dns;
  db.execute('UPDATE DNS SET Value = ? WHERE UserID = ?', [
    props.dns,
    props.userID,
  ]);
};

export const queryBypass = async (props: {
  userID: string;
}): Promise<Types.BypassDomains> => {
  const db = await initDb();
  const res = (await db.select(
    'SELECT BypassDomains FROM AppSettings WHERE UserID = ?',
    [props.userID],
  )) as Types.BypassDomains[];
  return res[0];
};

export const updateBypass = async (props: {
  userID: string;
  bypass: string;
}) => {
  const db = await initDb();
  db.execute('UPDATE AppSettings SET BypassDomains = ? WHERE UserID = ?', [
    props.bypass,
    props.userID,
  ]);
};

export const queryPAC = async (props: {
  userID: string;
}): Promise<Types.PAC> => {
  const db = await initDb();
  const res = (await db.select('SELECT PAC FROM AppSettings WHERE UserID = ?', [
    props.userID,
  ])) as Types.PAC[];
  return res[0];
};

export const updatePAC = async (props: { userID: string; pac: string }) => {
  const db = await initDb();
  db.execute('UPDATE AppSettings SET PAC = ? WHERE UserID = ?', [
    props.pac,
    props.userID,
  ]);
};

export const addEndpointToLocalsBaseInfo = async (props: {
  userID: string;
  endpointID: string;
  protocol: string;
  stream: string;
  security: string;
  remark: string;
  link?: string;
}) => {
  const db = await initDb();

  // Look specifically for the local-endpoints group, not any group
  const res = await db.select<Types.EndpointsGroups[]>(
    'SELECT * FROM EndpointsGroups WHERE UserID = ? AND GroupName = ?',
    [props.userID, 'local-endpoints'],
  );

  let localGroupID: string;
  let localGroupName: string;

  if (res.length > 0) {
    // Use existing local-endpoints group
    localGroupID = res[0].GroupID;
    localGroupName = res[0].GroupName;
  } else {
    // Create new local-endpoints group
    localGroupID = uuid();
    localGroupName = 'local-endpoints';

    await db.execute(
      `
      INSERT INTO EndpointsGroups (
        GroupID, UserID, GroupName, Remark, Link, SpeedTestType
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `,
      [
        localGroupID,
        props.userID,
        'local-endpoints',
        'Local Endpoints',
        '',
        'ping',
      ],
    );
  }

  await db.execute(
    `
    INSERT INTO Endpoints (
    EndpointID,
    Link,
    Remark,
    Latency,
    GroupID,
    GroupName
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      props.endpointID,
      props.link,
      props.remark,
      null,
      localGroupID,
      localGroupName,
      props.protocol,
      props.stream,
      props.security,
    ],
  );
  await db.execute(
    `
    INSERT INTO Outbounds (
    EndpointID,
    Protocol,
    Tag
    ) VALUES (?, ?, ?)`,
    [props.endpointID, props.protocol, null],
  );
  await db.execute(
    `
	  INSERT INTO StreamSettings (EndpointID, Network, Security) VALUES (?, ?, ?);
	  `,
    [props.endpointID, props.stream, props.security],
  );
};
export const addVmess = async (props: {
  endpointID: string;
  vmess: {
    address: string;
    port: number;
    uuid: string;
    alterID: number;
    security: string;
    level: number;
  };
}) => {
  const db = await initDb();
  const endpointID = props.endpointID;
  const { address, port, alterID, security, level } = props.vmess;
  const vnextID = uuid();
  await db.execute(
    `
    INSERT INTO VmessVnext (
    VnextID,
    Address,
    Port,
    EndpointID
    ) VALUES (?, ?, ?, ?);
    INSERT INTO VmessUsers (
    EndpointID,
    UUID,
    AlterID,
    Security,
    Level,
    VnextID
    ) VALUES (?, ?, ?, ?, ?, ?);`,
    [vnextID, address, port, endpointID].concat(
      endpointID,
      props.vmess.uuid,
      alterID,
      security,
      level,
      vnextID,
    ),
  );
};

const queryVmess = async (props: { endpointID: string }) => {
  const db = await initDb();
  const endpointID = props.endpointID;
  const res = await db.select<
    {
      UUID: string;
      AlterID: number;
      Security: string;
      Level: number;
      VnextID: string;
    }[]
  >('SELECT * FROM VmessUser L WHERE ? AND EndpointID = ?', [endpointID]);
};

export const updateVmess = async (props: {
  endpointID: string;
  vmess: {
    address: string;
    port: number;
    uuid: string;
    alterID: number;
    security: string;
    level: number;
  };
}) => {
  const db = await initDb();
  const { endpointID, vmess } = props;
  const { address, port, alterID, security, level, uuid } = vmess;

  const vnextID = (
    await db.select<{ VnextID: string }[]>(
      `SELECT VnextID FROM VmessVnext WHERE EndpointID = ?;`,
      [endpointID],
    )
  )[0].VnextID;

  await db.execute(
    `
    UPDATE VmessVnext
    SET Address = ?, Port = ?
    WHERE EndpointID = ? AND VnextID = ?;

    UPDATE VmessUsers
    SET UUID = ?, AlterID = ?, Security = ?, Level = ?
    WHERE EndpointID = ? AND VnextID = ?;
    `,
    [
      address,
      port,
      endpointID,
      vnextID,
      uuid,
      alterID,
      security,
      level,
      endpointID,
      vnextID,
    ],
  );
};

export const addShadowsocks = async (props: {
  endpointID: string;
  shadowsocks: {
    address: string;
    port: number;
    method: string;
    password: string;
    level: number;
  };
}) => {
  const db = await initDb();
  const endpointID = props.endpointID;
  const { address, port, method, password, level } = props.shadowsocks;
  await db.execute(
    `
    INSERT INTO Shadowsocks (
    EndpointID,
    Address,
    Port,
    Password,
    Method,
    Level
    ) VALUES (?, ?, ?, ?, ?, ?);
    `,
    [endpointID, address, port, password, method, level],
  );
};

export const updateShadowsocks = async (props: {
  endpointID: string;
  shadowsocks: {
    address: string;
    port: number;
    method: string;
    password: string;
    level: number;
  };
}) => {
  const db = await initDb();
  const { endpointID, shadowsocks } = props;
  const { address, port, method, password, level } = shadowsocks;

  await db.execute(
    `
    UPDATE Shadowsocks
    SET Address = ?, Port = ?, Method = ?, Password = ?, Level = ?
    WHERE EndpointID = ?;
    `,
    [address, port, method, password, level, endpointID],
  );
};

export const addTrojan = async (props: {
  endpointID: string;
  trojan: {
    address: string;
    port: number;
    password: string;
    level: number;
  };
}) => {
  const db = await initDb();
  const endpointID = props.endpointID;
  const { address, port, password, level } = props.trojan;
  await db.execute(
    `
    INSERT INTO TrojanServers(
    EndpointID,
    Address,
    Port,
    Password,
    Level
    ) VALUES (?, ?, ?, ?, ?);
    `,
    [endpointID, address, port, password, level],
  );
};

export const updateTrojan = async (props: {
  endpointID: string;
  trojan: {
    address: string;
    port: number;
    password: string;
    level: number;
  };
}) => {
  const db = await initDb();
  const { endpointID, trojan } = props;
  const { address, port, password, level } = trojan;

  const result = await db.execute(
    `
    UPDATE TrojanServers
    SET Address = ?, Port = ?, Password = ?, Level = ?
    WHERE EndpointID = ?;
    `,
    [address, port, password, level, endpointID],
  );
};

export const addHysteria2 = async (props: {
  endpointID: string;
  hysteria2: {
    address: string;
    port: number;
  };
}) => {
  const db = await initDb();
  const endpointID = props.endpointID;
  const { address, port } = props.hysteria2;
  await db.execute(
    `
    INSERT INTO Hysteria2(
    EndpointID,
    Address,
    Port
    ) VALUES (?, ?, ?);
    `,
    [endpointID, address, port],
  );
};

export const updateHysteria2 = async (props: {
  endpointID: string;
  hysteria2: {
    address: string;
    port: number;
  };
}) => {
  const db = await initDb();
  const { endpointID, hysteria2 } = props;
  const { address, port } = hysteria2;

  await db.execute(
    `
    UPDATE Hysteria2
    SET Address = ?, Port = ?
    WHERE EndpointID = ?;
    `,
    [address, port, endpointID],
  );
};

export const addHttp2Stream = async (props: {
  endpointID: string;
  http: {
    host: string;
    path: string;
    method: string;
  };
}) => {
  const db = await initDb();
  const endpointID = props.endpointID;
  const { host, path, method } = props.http;
  await db.execute(
    `
    INSERT INTO Http/2Settings(
    EndpointID,
    Host,
    Path,
    Method
    ) VALUES (?, ?, ?, ?);
    `,
    [endpointID, host, path, method],
  );
};

export const updateHttp2Stream = async (props: {
  endpointID: string;
  http: {
    host: string;
    path: string;
    method: string;
  };
}) => {
  const db = await initDb();
  const { endpointID, http } = props;
  const { host, path, method } = http;

  const result = await db.execute(
    `
    UPDATE Http/2Settings
    SET Host = ?, Path = ?, Method = ?
    WHERE EndpointID = ?;
    `,
    [host, path, method, endpointID],
  );
};

export const addKcpStream = async (props: {
  endpointID: string;
  kcp: {
    mtu: number;
    tti: number;
    uplinkCapacity: number;
    downlinkCapacity: number;
    congestion: boolean;
    readBufferSize: number;
    writeBufferSize: number;
    header: string;
  };
}) => {
  const db = await initDb();
  const endpointID = props.endpointID;
  const {
    mtu,
    tti,
    uplinkCapacity,
    downlinkCapacity,
    congestion,
    readBufferSize,
    writeBufferSize,
    header,
  } = props.kcp;
  await db.execute(
    `
    INSERT INTO KcpSettings (
    EndpointID,
    MTU,
    TTI,
    UplinkCapacity,
    DownlinkCapacity,
    Congestion,
    ReadBufferSize,
    WriteBufferSize,
    HeaderType
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
    `,
    [
      endpointID,
      mtu,
      tti,
      uplinkCapacity,
      downlinkCapacity,
      congestion ? 1 : 0,
      readBufferSize,
      writeBufferSize,
      header,
    ],
  );
};

export const updateKcpStream = async (props: {
  endpointID: string;
  kcp: {
    mtu: number;
    tti: number;
    uplinkCapacity: number;
    downlinkCapacity: number;
    congestion: boolean;
    readBufferSize: number;
    writeBufferSize: number;
    header: string;
  };
}) => {
  const db = await initDb();
  const { endpointID, kcp } = props;
  const {
    mtu,
    tti,
    uplinkCapacity,
    downlinkCapacity,
    congestion,
    readBufferSize,
    writeBufferSize,
    header,
  } = kcp;

  await db.execute(
    `
    UPDATE KcpSettings
    SET MTU = ?, TTI = ?, UplinkCapacity = ?, DownlinkCapacity = ?, Congestion = ?,
    ReadBufferSize = ?, WriteBufferSize = ?, HeaderType = ?
    WHERE EndpointID = ?;
    `,
    [
      mtu,
      tti,
      uplinkCapacity,
      downlinkCapacity,
      congestion ? 1 : 0,
      readBufferSize,
      writeBufferSize,
      header,
      endpointID,
    ],
  );
};

export const addQuicStream = async (props: {
  endpointID: string;
  quic: {
    key: string;
    security: string;
    header: string;
  };
}) => {
  const db = await initDb();
  const endpointID = props.endpointID;
  const { key, security, header } = props.quic;
  await db.execute(
    `
    INSERT INTO Quic (
    EndpointID,
    Key,
    Security,
    HeaderType
    ) VALUES (?, ?, ?, ?);
    `,
    [endpointID, key, security, header],
  );
};

export const updateQuicStream = async (props: {
  endpointID: string;
  quic: {
    key: string;
    security: string;
    header: string;
  };
}) => {
  const db = await initDb();
  const { endpointID, quic } = props;
  const { key, security, header } = quic;

  await db.execute(
    `
    UPDATE QuicSettings
    SET Key = ?, Security = ?, HeaderType = ?
    WHERE EndpointID = ?;
    `,
    [key, security, header, endpointID],
  );
};

export const addTcpStream = async (props: {
  endpointID: string;
  tcp: {
    header: string;
    requestHost: string | null;
    requestPath: string | null;
  };
}) => {
  const db = await initDb();
  const endpointID = props.endpointID;
  const { header, requestHost, requestPath } = props.tcp;
  await db.execute(
    `
    INSERT INTO TcpSettings (
    EndpointID,
    HeaderType,
    RequestHost,
    RequestPath
    ) VALUES (?, ?, ?, ?)`,
    [endpointID, header, requestHost, requestPath],
  );
};

export const updateTcpStream = async (props: {
  endpointID: string;
  tcp: {
    header: string;
    requestHost: string | null;
    requestPath: string | null;
  };
}) => {
  const db = await initDb();
  const { endpointID, tcp } = props;
  const { header, requestHost, requestPath } = tcp;

  const result = await db.execute(
    `
    UPDATE TcpSettings
    SET HeaderType = ?, RequestHost = ?, RequestPath = ?
    WHERE EndpointID = ?;
    `,
    [header, requestHost, requestPath, endpointID],
  );
};

export const addWebSocketStream = async (props: {
  endpointID: string;
  stream: { path: string; host: string };
}) => {
  const db = await initDb();
  const endpointID = props.endpointID;
  const { path, host } = props.stream;
  await db.execute(
    `
    INSERT INTO WsSettings (
    EndpointID,
    Path,
    Host
    ) VALUES (?, ?, ?)`,
    [endpointID, path, host],
  );
};

export const updateWebSocketStream = async (props: {
  endpointID: string;
  stream: { path: string; host: string };
}) => {
  const db = await initDb();
  const { endpointID, stream } = props;
  const { path, host } = stream;

  const result = await db.execute(
    `
    UPDATE WsSettings
    SET Path = ?, Host = ?
    WHERE EndpointID = ?;
    `,
    [path, host, endpointID],
  );
};

export const addGrpcStream = async (props: {
  endpointID: string;
  grpc: { serviceName: string };
}) => {
  const db = await initDb();
  const endpointID = props.endpointID;
  const { serviceName } = props.grpc;
  await db.execute(
    `
    INSERT INTO GrpcSettings (
    EndpointID,
    ServiceName
    ) VALUES (?, ?)`,
    [endpointID, serviceName],
  );
};

export const addHysteria2Stream = async (props: {
  endpointID: string;
  hysteria2: {
    password: string;
    type: string;
    uploadSpeed: number;
    downloadSpeed: number;
    enableUDP: boolean;
  };
}) => {
  const db = await initDb();
  const endpointID = props.endpointID;
  const { password, type, uploadSpeed, downloadSpeed, enableUDP } =
    props.hysteria2;
  await db.execute(
    `
    INSERT INTO Hysteria2Settings (
    EndpointID,
    Password,
    Type,
    UploadSpeed,
    DownloadSpeed,
    EnableUDP
    ) VALUES (?, ?, ?, ?, ?, ?)`,
    [endpointID, password, type, uploadSpeed, downloadSpeed, enableUDP ? 1 : 0],
  );
};

export const updateHysteria2Stream = async (props: {
  endpointID: string;
  hysteria2: {
    password: string;
    type: string;
    uploadSpeed: number;
    downloadSpeed: number;
    enableUDP: boolean;
  };
}) => {
  const db = await initDb();
  const { endpointID, hysteria2 } = props;
  const { password, type, uploadSpeed, downloadSpeed, enableUDP } = hysteria2;

  const result = await db.execute(
    `
    UPDATE Hysteria2Settings
    SET Password = ?, Type = ?, UploadSpeed = ?, DownloadSpeed = ?, EnableUDP = ?
    WHERE EndpointID = ?;
    `,
    [password, type, uploadSpeed, downloadSpeed, enableUDP ? 1 : 0, endpointID],
  );
};

export const updateGrpcStream = async (props: {
  endpointID: string;
  grpc: { serviceName: string };
}) => {
  const db = await initDb();
  const { endpointID, grpc } = props;
  const { serviceName } = grpc;

  const result = await db.execute(
    `
    UPDATE GrpcSettings
    SET ServiceName = ?
    WHERE EndpointID = ?;
    `,
    [serviceName, endpointID],
  );
};

export const addTlsSecurity = async (props: {
  endpointID: string;
  security: { allowInsecure: boolean; serverName: string };
}) => {
  const db = await initDb();
  const endpointID = props.endpointID;
  const { allowInsecure, serverName } = props.security;
  await db.execute(
    `
    INSERT INTO TlsSettings (
    EndpointID,
    AllowInsecure,
    ServerName
    ) VALUES (?, ?, ?)`,
    [endpointID, allowInsecure ? 1 : 0, serverName],
  );
};

export const updateTlsSecurity = async (props: {
  endpointID: string;
  security: { allowInsecure: boolean; serverName: string };
}) => {
  const db = await initDb();
  const { endpointID, security } = props;
  const { allowInsecure, serverName } = security;

  const result = await db.execute(
    `
    UPDATE TlsSettings
    SET AllowInsecure = ?, ServerName = ?
    WHERE EndpointID = ?;
    `,
    [allowInsecure ? 1 : 0, serverName, endpointID],
  );
};

export const queryEndpoint = async ({ endpointID }: { endpointID: string }) => {
  const result: {
    protocol: any;
    network: any;
    security: any;
    endpointID: string;
  } = {
    protocol: {},
    network: {},
    security: {},
    endpointID: '',
  };

  const db = await initDb();
  const endpoint = (
    await db.select<
      [
        {
          EndpointID: string;
          Link: string;
          Remark: string;
          Latency: number;
          GroupID: string;
          SpeedTestType: string;
          GroupName: string;
          Protocol: string;
          Network: string;
          Security: string;
        },
      ]
    >(
      `
		SELECT Endpoints.*, Outbounds.Protocol, StreamSettings.Network, StreamSettings.Security
		FROM Endpoints LEFT JOIN Outbounds ON Endpoints.EndpointID = Outbounds.EndpointID
		LEFT JOIN StreamSettings ON Endpoints.EndpointID = StreamSettings.EndpointID
		WHERE Endpoints.EndpointID = ?;
		`,
      [endpointID],
    )
  )[0];
  let protocolTableName = '';
  let protocolRes = {};
  switch (endpoint.Protocol) {
    case 'vmess':
      const vmess = (
        await db.select<Partial<Types.VmessUsers & Types.VmessVnext>[]>(
          `
          SELECT *
          FROM VmessUsers
          LEFT JOIN VmessVnext ON VmessUsers.VnextID = VmessVnext.VnextID
          WHERE VmessUsers.EndpointID = ?;
				`,
          [endpointID],
        )
      )[0];
      protocolRes = {
        type: 'vmess',
        Address: vmess.Address,
        Port: vmess.Port,
        UUID: vmess.UUID,
        AlterID: vmess.AlterID,
        Security: vmess.Security,
        Level: vmess.Level,
      };
      break;
    case 'shadowsocks':
      protocolTableName = 'Shadowsocks';
      break;
    case 'trojan':
      protocolTableName = 'TrojanServers';
      break;
    case 'hysteria2':
      protocolTableName = 'Hysteria2';
      break;
  }

  if (endpoint.Protocol !== 'vmess') {
    protocolRes = {
      type: endpoint.Protocol,
      ...(
        await db.select<any[]>(
          `
					SELECT *
					FROM ${protocolTableName}
					WHERE EndpointID = ?;
					`,
          [endpointID],
        )
      )[0],
    };
  }
  result.protocol = protocolRes;

  let networkTableName = '';
  switch (endpoint.Network) {
    case 'ws':
      networkTableName = 'WsSettings';
      break;
    case 'h2':
      networkTableName = 'Http2Settings';
      break;
    case 'quic':
      networkTableName = 'QuicSettings';
      break;
    case 'grpc':
      networkTableName = 'GrpcSettings';
      break;
    case 'kcp':
      networkTableName = 'KcpSettings';
      break;
    case 'tcp':
      networkTableName = 'TcpSettings';
      break;
    case 'hysteria2':
      networkTableName = 'Hysteria2Settings';
      break;
  }
  const streamRes = (
    await db.select<Types.StreamSettingsTypes[]>(
      `
					SELECT *
					FROM ${networkTableName}
					WHERE EndpointID = ?;
					`,
      [endpointID],
    )
  )[0];
  result.network = {
    type: endpoint.Network,
    ...streamRes,
  };
  switch (endpoint.Security) {
    case 'none':
      result.security = { type: 'none' };
      break;
    case 'tls':
      const tls = (
        await db.select<Types.TlsSettings[]>(
          `
					SELECT *
					FROM TlsSettings
					WHERE EndpointID = ?;
					`,
          [endpointID],
        )
      )[0];
      result.security = {
        type: 'tls',
        AllowInsecure: tls.AllowInsecure ? 1 : 0,
        ServerName: tls.ServerName,
      };
      break;
  }
  result.endpointID = endpointID;
  return result;
};

export const queryEndpointsGroups = async (props: { userID: string }) => {
  const db = await initDb();
  const res = await db.select<Types.EndpointsGroups[]>(
    `SELECT * FROM EndpointsGroups WHERE UserID = ?;`,
    [props.userID],
  );
  return res;
};

export const updateEndpointsGroups = async (props: {
  groupID: string;
  data: Partial<Types.EndpointsGroups>;
}) => {
  const db = await initDb();
  const { data, groupID } = props;

  // Filter out undefined keys and prepare parts for SQL statement
  const entries = Object.entries(data).filter(
    ([, value]) => value !== undefined,
  );
  if (entries.length === 0) return; // Exit if no data to update

  // Prepare SQL query parts
  const sqlSetParts = entries.map(([key]) => `${key} = ?`).join(', ');
  const sqlValues = entries.map(([, value]) => value);

  // Complete SQL query
  const sqlQuery = `UPDATE EndpointsGroups SET ${sqlSetParts} WHERE GroupID= ?;`;

  // Execute the update query
  await db.execute(sqlQuery, [...sqlValues, groupID]);
};

export const queryEndpoints = async (
  props: Partial<{
    groupID: string;
    userID: string;
  }>,
) => {
  const db = await initDb();

  // Construct the WHERE clause dynamically
  let whereClause = '';
  const params: (string | undefined)[] = [];

  if (props.userID) {
    whereClause += 'EndpointsGroups.UserID = ?';
    params.push(props.userID);
  }

  if (props.groupID) {
    if (whereClause) whereClause += ' AND '; // Add 'AND' if another condition exists
    whereClause += 'EndpointsGroups.GroupID = ?';
    params.push(props.groupID);
  }

  // Ensure the WHERE clause isn't empty before using it in the query
  if (whereClause) {
    whereClause = 'WHERE ' + whereClause;
  }

  const res = await db.select<Types.EndpointDetail[]>(
    `SELECT Endpoints.*, Outbounds.Protocol, StreamSettings.Network, StreamSettings.Security
     FROM Endpoints
     LEFT JOIN Outbounds ON Endpoints.EndpointID = Outbounds.EndpointID
     LEFT JOIN StreamSettings ON Endpoints.EndpointID = StreamSettings.EndpointID
     LEFT JOIN EndpointsGroups ON Endpoints.GroupID = EndpointsGroups.GroupID
     ${whereClause}`,
    params,
  );

  return res;
};

export const deleteEndpoint = async (props: { endpointID: string }) => {
  const db = await initDb();
  await db.execute('DELETE FROM StreamSettings WHERE EndpointID = ?', [
    props.endpointID,
  ]);
  await db.execute('DELETE FROM Outbounds WHERE EndpointID = ?', [
    props.endpointID,
  ]);
  await db.execute('DELETE FROM Endpoints WHERE EndpointID = ?', [
    props.endpointID,
  ]);
  await db.execute('DELETE FROM VmessUsers WHERE EndpointID = ?', [
    props.endpointID,
  ]);
  await db.execute('DELETE FROM VmessVnext WHERE EndpointID = ?', [
    props.endpointID,
  ]);
  await db.execute('DELETE FROM Shadowsocks WHERE EndpointID = ?', [
    props.endpointID,
  ]);
  await db.execute('DELETE FROM TrojanServers WHERE EndpointID = ?', [
    props.endpointID,
  ]);
  await db.execute('DELETE FROM Hysteria2 WHERE EndpointID = ?', [
    props.endpointID,
  ]);
  await db.execute('DELETE FROM "Http/2Settings" WHERE EndpointID = ?', [
    props.endpointID,
  ]);
  await db.execute('DELETE FROM KcpSettings WHERE EndpointID = ?', [
    props.endpointID,
  ]);
  await db.execute('DELETE FROM QuicSettings WHERE EndpointID = ?', [
    props.endpointID,
  ]);
  await db.execute('DELETE FROM TcpSettings WHERE EndpointID = ?', [
    props.endpointID,
  ]);
  await db.execute('DELETE FROM WsSettings WHERE EndpointID = ?', [
    props.endpointID,
  ]);
  await db.execute('DELETE FROM GrpcSettings WHERE EndpointID = ?', [
    props.endpointID,
  ]);
  await db.execute('DELETE FROM Hysteria2Settings WHERE EndpointID = ?', [
    props.endpointID,
  ]);
  await db.execute('DELETE FROM TlsSettings WHERE EndpointID = ?', [
    props.endpointID,
  ]);
};

// Delete all endpoints in a group but keep the group itself
export const deleteEndpointsInGroup = async (props: { groupID: string }) => {
  const db = await initDb();
  const endpoints = await queryEndpoints({
    groupID: props.groupID,
  });
  // Delete all endpoints and their related data
  await Promise.all(
    endpoints.map((endpoint) =>
      deleteEndpoint({ endpointID: endpoint.EndpointID }),
    ),
  );
};

export const deleteGroup = async (props: { groupID: string }) => {
  const db = await initDb();
  // First delete all endpoints in the group
  await deleteEndpointsInGroup({ groupID: props.groupID });
  // Then delete the group itself
  await db.execute('DELETE FROM EndpointsGroups WHERE GroupID = ?', [
    props.groupID,
  ]);
};

export const handleSelectEndpoint = async (props: { endpointID: string }) => {
  const db = await initDb();
  await db.execute(
    `UPDATE Endpoints
         SET Active = CASE
                       WHEN EndpointID = ? THEN 1
                       ELSE 0
                     END
         WHERE Active = 1 OR EndpointID = ?`,
    [props.endpointID, props.endpointID],
  );
};

export const queryLog = async (props: { userID: string }) => {
  const db = await initDb();
  const res = await db.select<Types.Log[]>(
    `SELECT * FROM Log WHERE UserID = ?`,
    [props.userID],
  );
  return res[0];
};

export const queryLanuage = async (props: { userID: string }) => {
  const db = await initDb();
  const res = await db.select<Types.AppSettings[]>(
    `SELECT Language FROM AppSettings WHERE UserID = ?`,
    [props.userID],
  );
  return res[0].Language;
};

export const queryAutoCheckUpdate = async (props: { userID: string }) => {
  const db = await initDb();
  const res = await db.select<Types.AppSettings[]>(
    `SELECT AutoDownloadAndInstallUpgrades FROM AppSettings WHERE UserID = ?`,
    [props.userID],
  );
  return res[0].AutoDownloadAndInstallUpgrades === 1;
};

export const updateAutoCheckUpdate = async (props: {
  userID: string;
  autoCheckUpdate: boolean;
}) => {
  const db = await initDb();
  await db.execute(
    `UPDATE AppSettings SET AutoDownloadAndInstallUpgrades = ? WHERE UserID = ?`,
    [props.autoCheckUpdate ? 1 : 0, props.userID],
  );
};

export const updateServiceRunningState = async (props: {
  userID: string;
  serviceRunningState: boolean;
}) => {
  const db = await initDb();
  await db.execute(
    `UPDATE AppStatus SET ServiceRunningState = ? WHERE UserID = ?`,
    [props.serviceRunningState ? 1 : 0, props.userID],
  );
};

export const queryLatencyTestSettings = async (props: {
  userID: string;
}): Promise<{ url: string; timeout: number }> => {
  const db = await initDb();
  const res = await db.select<
    { LatencyTestUrl: string; LatencyTestTimeout: number }[]
  >(
    'SELECT LatencyTestUrl, LatencyTestTimeout FROM AppSettings WHERE UserID = ?',
    [props.userID],
  );

  return {
    url: res[0].LatencyTestUrl,
    timeout: res[0].LatencyTestTimeout,
  };
};

export const updateLatencyTestSettings = async (props: {
  userID: string;
  url: string;
  timeout: number;
}) => {
  const db = await initDb();
  await db.execute(
    'UPDATE AppSettings SET LatencyTestUrl = ?, LatencyTestTimeout = ? WHERE UserID = ?',
    [props.url, props.timeout, props.userID],
  );
};

export const querySubscriptions = async (props: {
  userID: string;
}): Promise<
  { Remark: string; Url: string; GroupID: string; SubscriptionID: string }[]
> => {
  const db = await initDb();
  const res = await db.select<
    { Remark: string; Url: string; GroupID: string; SubscriptionID: string }[]
  >(
    'SELECT Remark, Url, GroupID, SubscriptionID FROM Subscriptions WHERE UserID = ?',
    [props.userID],
  );

  return res;
};

export const checkDuplicateSubscription = async (props: {
  userID: string;
  url: string;
}): Promise<boolean> => {
  const db = await initDb();
  const existing = await db.select<Array<{ SubscriptionID: string }>>(
    'SELECT SubscriptionID FROM Subscriptions WHERE UserID = ? AND Url = ?',
    [props.userID, props.url],
  );
  return existing.length > 0;
};

export const addSubscription = async (props: {
  userID: string;
  remark: string;
  url: string;
  groupID: string;
}): Promise<void> => {
  const db = await initDb();

  // Check for duplicate subscription
  const isDuplicate = await checkDuplicateSubscription({
    userID: props.userID,
    url: props.url,
  });

  if (isDuplicate) {
    throw new Error('Subscription with this URL already exists');
  }

  const subscriptionID = uuid();

  await db.execute(
    `INSERT INTO Subscriptions (UserID, Remark, Url, SubscriptionID, GroupID)
     VALUES (?, ?, ?, ?, ?)`,
    [props.userID, props.remark, props.url, subscriptionID, props.groupID],
  );
};

export const deleteSubscription = async (props: {
  subscriptionID: string;
}): Promise<void> => {
  const db = await initDb();

  await db.execute(`DELETE FROM Subscriptions WHERE SubscriptionID = ?`, [
    props.subscriptionID,
  ]);
};

export const updateSubscription = async (props: {
  subscriptionID: string;
  remark?: string;
  url?: string;
}): Promise<void> => {
  const db = await initDb();

  // Only update fields that are provided
  if (props.remark !== undefined && props.url !== undefined) {
    await db.execute(
      `UPDATE Subscriptions SET Remark = ?, Url = ? WHERE SubscriptionID = ?`,
      [props.remark, props.url, props.subscriptionID],
    );
  } else if (props.remark !== undefined) {
    await db.execute(
      `UPDATE Subscriptions SET Remark = ? WHERE SubscriptionID = ?`,
      [props.remark, props.subscriptionID],
    );
  } else if (props.url !== undefined) {
    await db.execute(
      `UPDATE Subscriptions SET Url = ? WHERE SubscriptionID = ?`,
      [props.url, props.subscriptionID],
    );
  }
};

export const updateAllSubscriptions = async (props: {
  userID: string;
}): Promise<void> => {
  const db = await initDb();

  // Get all subscriptions for the user
  const subscriptions = await querySubscriptions(props);

  // In a real implementation, you would:
  // 1. Fetch content from each subscription URL
  // 2. Parse the content to extract endpoints
  // 3. Add or update endpoints in the database
  // 4. Remove endpoints that are no longer in the subscription

  // This is a placeholder implementation
  // You'll need to add actual subscription fetching and parsing logic

  // For now, we'll just log that update occurred
  console.log(
    `Updated subscriptions for user ${props.userID} at ${new Date().toISOString()}`,
  );
};

// Helper function to create or get EndpointsGroups for a subscription
const ensureEndpointsGroup = async (props: {
  userID: string;
  groupID: string;
  subscriptionID: string;
  remark: string;
  link: string;
}): Promise<string> => {
  const db = await initDb();

  // Check if group already exists
  const existingGroup = await db.select<Types.EndpointsGroups[]>(
    'SELECT * FROM EndpointsGroups WHERE GroupID = ? AND UserID = ?',
    [props.groupID, props.userID],
  );

  if (existingGroup.length > 0) {
    // Update the group if it exists (in case remark or link changed)
    await db.execute(
      `
      UPDATE EndpointsGroups 
      SET GroupName = ?, Remark = ?, Link = ?, SubscriptionID = ?
      WHERE GroupID = ? AND UserID = ?
      `,
      [
        props.remark || 'Subscription Group',
        props.remark || 'Subscription Group',
        props.link,
        props.subscriptionID,
        props.groupID,
        props.userID,
      ],
    );
    return existingGroup[0].GroupID;
  }

  // Create new group with subscription remark as group name
  await db.execute(
    `
    INSERT INTO EndpointsGroups (
      GroupID, UserID, GroupName, Remark, Link, SubscriptionID, SpeedTestType
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
    [
      props.groupID,
      props.userID,
      props.remark || 'Subscription Group',
      props.remark || 'Subscription Group',
      props.link,
      props.subscriptionID,
      'ping',
    ],
  );

  return props.groupID;
};

// Parse subscription data and create endpoints
export const parseSubscriptionAndCreateEndpoints = async (props: {
  userID: string;
  subscriptionID: string;
  groupID: string;
  remark: string;
  link: string;
  subscriptionData: string;
}): Promise<{ success: number; failed: number }> => {
  const { VMess, Shadowsocks, Trojan, Hysteria2 } =
    await import('~/lib/protocol');

  let successCount = 0;
  let failedCount = 0;

  // Ensure the endpoints group exists
  await ensureEndpointsGroup({
    userID: props.userID,
    groupID: props.groupID,
    subscriptionID: props.subscriptionID,
    remark: props.remark,
    link: props.link,
  });

  // Delete all existing endpoints in this group before adding new ones
  await deleteEndpointsInGroup({ groupID: props.groupID });

  // Parse subscription data - split by lines
  const lines = props.subscriptionData
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  for (const line of lines) {
    try {
      let protocolFactory: any = null;
      let protocol = '';
      let endpointID = uuid();
      let link = '';
      let remark = '';
      let stream = 'tcp';
      let security = 'none';

      // Determine protocol type and create protocol factory
      if (/^vmess:\/\//i.test(line)) {
        protocolFactory = new VMess(line);
        protocol = 'vmess';
      } else if (/^ss:\/\//i.test(line)) {
        protocolFactory = new Shadowsocks(line);
        protocol = 'shadowsocks';
      } else if (/^trojan:\/\//i.test(line)) {
        protocolFactory = new Trojan(line);
        protocol = 'trojan';
      } else if (/^hysteria2:\/\//i.test(line)) {
        protocolFactory = new Hysteria2(line);
        protocol = 'hysteria2';
      } else {
        console.warn(
          `Unsupported protocol in line: ${line.substring(0, 50)}...`,
        );
        failedCount++;
        continue;
      }

      // Get link and remark
      link = protocolFactory.getLink();
      remark = protocolFactory.getPs() || `Endpoint ${successCount + 1}`;

      // Get stream and security from outbound
      const outbound = protocolFactory.getOutbound();
      stream = outbound.streamSettings?.network || 'tcp';
      security = outbound.streamSettings?.security || 'none';

      // Create base endpoint info directly with the correct subscription group
      const db = await initDb();
      await db.execute(
        `
        INSERT INTO Endpoints (
          EndpointID, Link, Remark, Latency, GroupID, GroupName
        ) VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          endpointID,
          link,
          remark,
          null,
          props.groupID,
          props.remark || 'Subscription Group',
        ],
      );

      await db.execute(
        `
        INSERT INTO Outbounds (EndpointID, Protocol, Tag)
        VALUES (?, ?, ?)
        `,
        [endpointID, protocol, null],
      );

      await db.execute(
        `
        INSERT INTO StreamSettings (EndpointID, Network, Security)
        VALUES (?, ?, ?)
        `,
        [endpointID, stream, security],
      );

      // Add protocol-specific data
      switch (protocol) {
        case 'vmess': {
          const settings = outbound.settings as any;
          if (settings?.vnext?.[0]?.users?.[0]) {
            const vnext = settings.vnext[0];
            const user = vnext.users[0];
            await addVmess({
              endpointID,
              vmess: {
                address: vnext.address,
                port: vnext.port,
                uuid: user.id,
                alterID: user.alterId || 0,
                security: user.security || 'auto',
                level: user.level || 0,
              },
            });
          }
          break;
        }
        case 'shadowsocks': {
          const settings = outbound.settings as any;
          if (settings?.servers?.[0]) {
            const server = settings.servers[0];
            await addShadowsocks({
              endpointID,
              shadowsocks: {
                address: server.address,
                port: server.port,
                method: server.method,
                password: server.password,
                level: server.level || 0,
              },
            });
          }
          break;
        }
        case 'trojan': {
          const settings = outbound.settings as any;
          if (settings?.servers?.[0]) {
            const server = settings.servers[0];
            await addTrojan({
              endpointID,
              trojan: {
                address: server.address,
                port: server.port,
                password: server.password,
                level: server.level || 0,
              },
            });
          }
          break;
        }
        case 'hysteria2': {
          const settings = outbound.settings as any;
          if (settings?.servers?.[0]) {
            const server = settings.servers[0];
            await addHysteria2({
              endpointID,
              hysteria2: {
                address: server.address,
                port: server.port,
              },
            });
          }
          break;
        }
      }

      // Add stream settings
      const streamSettings = outbound.streamSettings;
      if (streamSettings) {
        switch (stream) {
          case 'ws':
            if (streamSettings.wsSettings) {
              await addWebSocketStream({
                endpointID,
                stream: {
                  path: streamSettings.wsSettings.path || '/',
                  host: streamSettings.wsSettings.headers?.host || '',
                },
              });
            }
            break;
          case 'h2':
            if (streamSettings.httpSettings) {
              await addHttp2Stream({
                endpointID,
                http: {
                  host: Array.isArray(streamSettings.httpSettings.host)
                    ? streamSettings.httpSettings.host[0] || ''
                    : streamSettings.httpSettings.host || '',
                  path: streamSettings.httpSettings.path || '/',
                  method: 'PUT',
                },
              });
            }
            break;
          case 'grpc':
            if (streamSettings.grpcSettings) {
              await addGrpcStream({
                endpointID,
                grpc: {
                  serviceName: streamSettings.grpcSettings.serviceName || '',
                },
              });
            }
            break;
          case 'kcp':
            if (streamSettings.kcpSettings) {
              await addKcpStream({
                endpointID,
                kcp: {
                  mtu: streamSettings.kcpSettings.mtu || 1350,
                  tti: streamSettings.kcpSettings.tti || 50,
                  uplinkCapacity:
                    streamSettings.kcpSettings.uplinkCapacity || 5,
                  downlinkCapacity:
                    streamSettings.kcpSettings.downlinkCapacity || 20,
                  congestion: streamSettings.kcpSettings.congestion || false,
                  readBufferSize:
                    streamSettings.kcpSettings.readBufferSize || 2,
                  writeBufferSize:
                    streamSettings.kcpSettings.writeBufferSize || 2,
                  header: streamSettings.kcpSettings.header?.type || 'none',
                },
              });
            }
            break;
          case 'quic':
            if (streamSettings.quicSettings) {
              await addQuicStream({
                endpointID,
                quic: {
                  key: streamSettings.quicSettings.key || '',
                  security: streamSettings.quicSettings.security || 'none',
                  header: streamSettings.quicSettings.header?.type || 'none',
                },
              });
            }
            break;
          case 'tcp':
            if (streamSettings.tcpSettings) {
              await addTcpStream({
                endpointID,
                tcp: {
                  header: streamSettings.tcpSettings.header?.type || 'none',
                  requestHost:
                    streamSettings.tcpSettings.header?.request?.headers
                      ?.Host?.[0] || null,
                  requestPath:
                    streamSettings.tcpSettings.header?.request?.path?.[0] ||
                    null,
                },
              });
            }
            break;
          case 'hysteria2':
            if (streamSettings.hysteria2Settings) {
              await addHysteria2Stream({
                endpointID,
                hysteria2: {
                  password: streamSettings.hysteria2Settings.password || '',
                  type:
                    streamSettings.hysteria2Settings.congestion?.type || 'bbr',
                  uploadSpeed:
                    streamSettings.hysteria2Settings.congestion?.up_mbps || 50,
                  downloadSpeed:
                    streamSettings.hysteria2Settings.congestion?.down_mbps ||
                    100,
                  enableUDP:
                    streamSettings.hysteria2Settings.use_udp_extension || false,
                },
              });
            }
            break;
        }
      }

      // Add security settings
      if (security === 'tls' && streamSettings?.tlsSettings) {
        await addTlsSecurity({
          endpointID,
          security: {
            allowInsecure: streamSettings.tlsSettings.allowInsecure || false,
            serverName: streamSettings.tlsSettings.serverName || '',
          },
        });
      }

      successCount++;
    } catch (error) {
      console.error(
        `Failed to parse endpoint from line: ${line.substring(0, 50)}...`,
        error,
      );
      failedCount++;
    }
  }

  return { success: successCount, failed: failedCount };
};

export { Types };
