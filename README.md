```txt
██╗░░░██╗██████╗░██████╗░░█████╗░██╗░░░██╗██╗░░██╗
██║░░░██║╚════██╗██╔══██╗██╔══██╗╚██╗░██╔╝╚██╗██╔╝
╚██╗░██╔╝░░███╔═╝██████╔╝███████║░╚████╔╝░░╚███╔╝░
░╚████╔╝░██╔══╝░░██╔══██╗██╔══██║░░╚██╔╝░░░██╔██╗░
░░╚██╔╝░░███████╗██║░░██║██║░░██║░░░██║░░░██╔╝╚██╗
░░░╚═╝░░░╚══════╝╚═╝░░╚═╝╚═╝░░╚═╝░░░╚═╝░░░╚═╝░░╚═╝
```

[● Telegram Channel](https://t.me/V2rayX_electron)

# WARN: text below will change in development. product is not ready to release beta (release day will be soon)

## I. V2ray Electron

V2ray GUI client with cross-platform desktop support powered by Electron⚛️, made specially for Linux / Windows / MacOS users.

### ➣ Tested on

- Ubuntu22.10 (amd64)
- MacOS Ventura (x64)
- Windows10/11 (x64)

### ➣ Future test plan

- Linux Kali/Manjaro (x64)

## II. Features

### ➣ Supported (TODO List)

- [ ] **SS / SSR** Protocol
- [ ] **PAC** Mode
  - Auto proxy mode for browser that use [GFWList](https://raw.githubusercontent.com/gfwlist/gfwlist/master/gfwlist.txt) as default rules.
  - Allow custom rules.
- [ ] **Global** Mode
  - Global socks5 proxy for browser.
- [ ] **Manual** Mode
  - Get some tools like SwitchOmega to enable browser proxy on this mode.
- [ ] **HTTP(S)** Proxy
  - On Windows, commands for terminal proxy(port 1087 as default):
    - `$env:HTTPS_PROXY="http://127.0.0.1:1087"` (powershell)
    - `$env:HTTP_PROXY="http://127.0.0.1:1087"` (powershell)
    - `set http_proxy=http://127.0.0.1:1087` (cmd)
    - `set https_proxy=http://127.0.0.1:1087` (cmd)
  - On Linux/MacOS, commands for terminal proxy:
    - `export http_proxy="127.0.0.1:1087"`
    - `export https_proxy="127.0.0.1:1087"`
    - Some tools like `proxychains` is deep recommended.
- [ ] ACL (access control list)
- [ ] Nodes Load-Balancing Mode
- [ ] Clipboard / QR-code Import
- [ ] Subscription Import
- [ ] Language Detecting And Switching (zh-CN / en-US / ru-RU)
- [ ] Configuration Backup / Recovery
- [ ] Dark / Light Mode
- [ ] Auto Start
- [ ] Server Share
- [ ] Activity Logs

### ➣ In Testing

### ➣ Comming Soon

## III. Problems

## IV. Supported Platforms & Arch

![system](https://img.shields.io/badge/system-win%20%7C%20mac%20%7C%20linux-green)

> More architectures will be supported if necessary, just give me an issue.

- Ubuntu
  - deb `x64/x86/arm64`
  - AppImage `x64/x86/arm64`
  - snap `x64`
- MacOS
  - dmg `x64/arm64`
  - zip `x64/arm64`
- Windows
  - exe `x64/x86`
  - zip `x64/x86`

## V. Screenshots

### Home Page

### Dark Mode

## VI. Downloads

- GitHub Releases

  - ![statistics](https://img.shields.io/github/downloads/shaonhuang/V2rayX/total?style=plastic)
  - [↪ releases page](https://github.com/shaonhuang/V2rayX/releases/latest)

- ElectronJs Website

- Snapcraft Store (linux)

## VII. Plugins Downloads

> not necessary, just for some advanced users.

## IX. Why?

## X. Development

### 1. Env

- Node@^`18.14.0`
- Ubuntu18.04 or higher version
- Mac catalina or other versions (works in most recent versions in theory)
- Windows 10 (WSL tested)or higher version

### 2. Prepare

```bash
# for ubuntu developers
# for mac developers

# proxy env set (if your local machine support)
export HTTPS_PROXY=http://127.0.0.1:<port>
export HTTP_PROXY=http://127.0.0.1:<port>
```

### 3. Run commands in terminal

```bash
# [01]clone
$: git clone https://github.com/shaonhuang/V2rayX.git
$: cd v2rayx

# for china developers
$: npm config set electron_mirror http://npm.taobao.org/mirrors/electron/

# [02]npm
$: npm i -g yarn
$: yarn

# [04]start
$: yarn start
```

## XI. Mention

## XII. Credit
