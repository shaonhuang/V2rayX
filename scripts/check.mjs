import fs, { writeSync } from "fs";
import fsp from "fs/promises";
import zlib from "zlib";
import { extract } from "tar";
import path from "path";
import AdmZip from "adm-zip";
import fetch from "node-fetch";
import proxyAgent from "https-proxy-agent";
import { execFile, execSync } from "child_process";
import { log_info, log_debug, log_error, log_success } from "./utils.mjs";
// import { glob } from "glob";

const cwd = process.cwd();
const TEMP_DIR = path.join(cwd, "node_modules/.v2ray-core");
const FORCE = process.argv.includes("--force");


const PLATFORM_MAP = {
  "x86_64-pc-windows-msvc": "win32",
  "i686-pc-windows-msvc": "win32",
  "aarch64-pc-windows-msvc": "win32",
  "x86_64-apple-darwin": "darwin",
  "aarch64-apple-darwin": "darwin",
  "x86_64-unknown-linux-gnu": "linux",
  "i686-unknown-linux-gnu": "linux",
  "aarch64-unknown-linux-gnu": "linux",
  "armv7-unknown-linux-gnueabihf": "linux",
  "riscv64gc-unknown-linux-gnu": "linux",
  "loongarch64-unknown-linux-gnu": "linux",
};
const ARCH_MAP = {
  "x86_64-pc-windows-msvc": "x64",
  "i686-pc-windows-msvc": "ia32",
  "aarch64-pc-windows-msvc": "arm64",
  "x86_64-apple-darwin": "x64",
  "aarch64-apple-darwin": "arm64",
  "x86_64-unknown-linux-gnu": "x64",
  "i686-unknown-linux-gnu": "ia32",
  "aarch64-unknown-linux-gnu": "arm64",
  "armv7-unknown-linux-gnueabihf": "arm",
  "riscv64gc-unknown-linux-gnu": "riscv64",
  "loongarch64-unknown-linux-gnu": "loong64",
};

const arg1 = process.argv.slice(2)[0];
const arg2 = process.argv.slice(2)[1];
const target = arg1 === "--force" ? arg2 : arg1;
const { platform, arch } = target
  ? { platform: PLATFORM_MAP[target], arch: ARCH_MAP[target] }
  : process;

const SIDECAR_HOST = target
  ? target
  : execSync("rustc -vV")
      .toString()
      .match(/(?<=host: ).+(?=\s*)/g)[0];

/* ======= v2ray-core meta alpha======= */
const META_V2RAY_CORE_VERSION_URL =
  "https://api.github.com/repos/v2fly/v2ray-core/tags";
const META_V2RAY_CORE_URL_PREFIX = `https://github.com/v2fly/v2ray-core/releases/download`;
let META_V2RAY_CORE_VERSION;

const META_ARCH_MAP = {
  "win32-x64": "v2ray-windows-64",
  "win32-ia32": "v2ray-windows-32",
  "win32-arm64": "v2ray-windows-arm64-v8a",
  "darwin-x64": "v2ray-macos-64",
  "darwin-arm64": "v2ray-macos-arm64-v8a",
  "linux-x64": "v2ray-linux-64",
  "linux-ia32": "v2ray-linux-32",
  "linux-arm64": "v2ray-linux-arm64-v8a",
  "linux-arm": "v2ray-linux-arm32-v7a",
  "linux-riscv64": "v2ray-linux-riscv64",
  "linux-loong64": "v2ray-linux-loong64",
};


// Fetch the latest alpha release version from the response
async function getLatestV2rayCoreVersion() {
  const options = {};

  // Configure proxy if environment variables are set
  const httpProxy =
    process.env.HTTP_PROXY ||
    process.env.http_proxy ||
    process.env.HTTPS_PROXY ||
    process.env.https_proxy;

  if (httpProxy) {
    options.agent = proxyAgent(httpProxy);
  }

  try {
    // Fetch the latest tags from GitHub API without authentication
    const response = await fetch(META_V2RAY_CORE_VERSION_URL, {
      ...options,
      method: "GET",
      headers: {
        "Accept": "application/vnd.github.v3+json"
      },
    });

    // Check if the response is OK
    if (!response.ok) {
      throw new Error(`GitHub API responded with status ${response.status}: ${response.statusText}`);
    }

    // Optional: Handle rate limiting
    const remaining = response.headers.get('X-RateLimit-Remaining');
    const resetTime = response.headers.get('X-RateLimit-Reset');

    if (remaining !== null) {
      log_info(`GitHub API Rate Limit Remaining: ${remaining}`);
      if (parseInt(remaining, 10) === 0) {
        const resetDate = new Date(parseInt(resetTime, 10) * 1000);
        log_error(`Rate limit exceeded. Resets at ${resetDate.toISOString()}.`);
        process.exit(1);
      }
    }

    // Parse the JSON response
    const tags = await response.json();

    // Extract the first tag's name
    const TAG_NAME = tags[0]?.name || null;

    // Debug: Print the extracted tag name
    log_info(`Extracted TAG_NAME: ${TAG_NAME}`);

    // Check if TAG_NAME was successfully extracted
    if (!TAG_NAME || TAG_NAME === "null") {
      log_error("Failed to fetch the latest v2ray-core version.");
      process.exit(1);
    }

    // Remove the leading 'v' from the tag name to get the version
    const version = TAG_NAME.startsWith('v') ? TAG_NAME.substring(1) : TAG_NAME;

    log_info(`Latest v2ray-core version: ${version}`);

    // Export the version to be used in subsequent steps
    // If you're using this in a GitHub Actions workflow, you can set it like this:
    // Note: This assumes you're running this script in a GitHub Actions environment.
    console.log(`V2RAY_VERSION=${version}`);
    // Alternatively, you can write to the GITHUB_ENV file to set the environment variable
    // const fs = require('fs');
    // fs.appendFileSync(process.env.GITHUB_ENV, `V2RAY_VERSION=${version}\n`);

    // If not using GitHub Actions, you might set it in process.env or return it
    process.env.V2RAY_VERSION = version;
    META_V2RAY_CORE_VERSION = version;
    // FIXME: don't forget write this version to .env
    // Optionally return the version
    return version;

  } catch (error) {
    log_error("Error fetching latest v2ray-core version:", error.message);
    process.exit(1);
  }
}


/**
 * core info
 */
function v2rayMeta() {
  const name = META_ARCH_MAP[`${platform}-${arch}`];
  const isWin = platform === "win32";
  const downloadURL = `${META_V2RAY_CORE_URL_PREFIX}/v${META_V2RAY_CORE_VERSION}/${name}.zip`;
  const exeFile = `v2ray${isWin ? ".exe" : ""}`;
  const zipFile = `${name}-${META_V2RAY_CORE_VERSION}.zip`;

  return {
    name: "v2ray-core",
    targetFile: `v2ray-${SIDECAR_HOST}${isWin ? ".exe" : ""}`,
    exeFile,
    zipFile,
    downloadURL,
  };
}

/**
 * download file and save to `path`
 */ async function downloadFile(url, path) {
  const options = {};

  const httpProxy =
    process.env.HTTP_PROXY ||
    process.env.http_proxy ||
    process.env.HTTPS_PROXY ||
    process.env.https_proxy;

  if (httpProxy) {
    options.agent = proxyAgent(httpProxy);
  }

  const response = await fetch(url, {
    ...options,
    method: "GET",
    headers: { "Content-Type": "application/octet-stream" },
  });
  const buffer = await response.arrayBuffer();
  await fsp.writeFile(path, new Uint8Array(buffer));

  log_success(`download finished: ${url}`);
}

/**
 * download sidecar and rename
 */
async function resolveSidecar(binInfo) {
  const { name, targetFile, zipFile, exeFile, downloadURL } = binInfo;

  console.log(name, targetFile, zipFile, exeFile, downloadURL);
  const sidecarDir = path.join(cwd, "src-tauri", "binaries");
  const sidecarPath = path.join(sidecarDir, targetFile);

  await fsp.mkdir(sidecarDir, { recursive: true });
  if (!FORCE && fs.existsSync(sidecarPath)) return;

  const tempDir = path.join(TEMP_DIR, name);
  const tempZip = path.join(tempDir, zipFile);
  const tempExe = path.join(tempDir, exeFile);

  await fsp.mkdir(tempDir, { recursive: true });
  try {
    if (!fs.existsSync(tempZip)) {
      await downloadFile(downloadURL, tempZip);
    }

    const zip = new AdmZip(tempZip);
    zip.getEntries().forEach((entry) => {
      log_debug(`"${name}" entry name`, entry.entryName);
    });
    zip.extractAllTo(tempDir, true);
    await fsp.rename(tempExe, sidecarPath);
    log_success(`unzip finished: "${name}"`);
  } catch (err) {
    await fsp.rm(sidecarPath, { recursive: true, force: true });
    throw err;
  } finally {
    // delete temp dir
    await fsp.rm(tempDir, { recursive: true, force: true });
  }
}



const resolveV2rayExecutable = (binInfo) => {
    const { name, targetFile } = binInfo;
    if (platform === 'linux' || platform === 'darwin') {
      const sidecarDir = path.join(cwd, "src-tauri", "binaries");
      const sidecarPath = path.join(sidecarDir, targetFile);
      execSync(`chmod +x ${sidecarPath}`);
      log_success(`chmod binary finished: "${targetFile}"`);
    }
};

const resolveAppVersionAndCoreVersionToEnv= () => {
    const filePath = path.join(cwd, "src-tauri", 'tauri.conf.json');

    try {
        // Read the JSON file
        const data = fs.readFileSync(filePath, 'utf8');
        const jsonData = JSON.parse(data);

        // Extract the version
        const version = jsonData.version;

        if (!version) {
            log_error('Failed to extract version from tauri.conf.json');
            process.exit(1);
        }
        if (!fs.existsSync('.env')) {
          try {
               // Open the .env file for writing, create it if it doesn't exist (mode 'w')
            const fd = fs.openSync('.env', 'w'); // 'w' means write mode

               // Write VITE_APP_VERSION to the file
               const content = `VITE_APP_VERSION=${META_V2RAY_CORE_VERSION}\nVITE_APP_VERSION=${version}\n`;
               // Write content to the file synchronously
               fs.writeSync(fd, content);
               // Close the file after writing
               fs.closeSync(fd);

           } catch (err) {
               console.error('Error writing to .env file:', err.message);
           }
        }

        // Export VITE_APP_VERSION to GitHub environment (just simulating here)
        log_info(`VITE_APP_VERSION=${version}`);

        // In a GitHub Actions environment, you would write to the environment file like this:
        // fs.appendFileSync(process.env.GITHUB_ENV, `VITE_APP_VERSION=${version}\n`);
    } catch (err) {
        log_error('Error reading or parsing tauri.conf.json:', err.message);
        process.exit(1);
    }
};

const tasks = [
  {
    name: "check v2ray-core latest version",
    func: () =>
      getLatestV2rayCoreVersion().then(() => resolveSidecar(v2rayMeta())),
    retry: 5,
  },
  {
    name: "add +x to v2ray",
    func: () => resolveV2rayExecutable(v2rayMeta()),
    retry: 5,
    macosOnly: true,
  },
  {
    name: "get app version and core version to .env",
    func: () => resolveAppVersionAndCoreVersionToEnv(v2rayMeta()),
    retry: 5,
    macosOnly: true,
  },
];


async function runTask() {
  const task = tasks.shift();
  if (!task) return;
  if (task.unixOnly && platform === "win32") return runTask();
  if (task.winOnly && platform !== "win32") return runTask();
  if (task.macosOnly && platform !== "darwin") return runTask();
  if (task.linuxOnly && platform !== "linux") return runTask();

  for (let i = 0; i < task.retry; i++) {
    try {
      await task.func();
      break;
    } catch (err) {
      log_error(`task::${task.name} try ${i} ==`, err.message);
      if (i === task.retry - 1) throw err;
    }
  }
  return runTask();
}

runTask();
