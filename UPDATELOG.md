## v0.5.2

### v0.5.2 Compared to v0.5.1

#### New Features

- **Import from Screenshot**:
  - Added ability to take screenshots and automatically detect QR codes
  - Supports importing VMess, Shadowsocks, Trojan, and Hysteria2 protocols from QR codes
  - Visual QR code detection with corner markers highlighting
  - Can process screenshots from clipboard or take new screenshots
  - Automatic protocol validation and import

- **Import from Subscription**:
  - Added subscription management feature
  - Support for multiple subscription URLs
  - Automatic subscription updates with progress tracking
  - Batch import of endpoints from subscriptions
  - Base64 decoding support for subscription data
  - Subscription status tracking and management

- **Latency Test**:
  - Added endpoint latency testing functionality
  - Supports multiple test types: ping, connect, and TCP
  - Configurable test URL and timeout settings
  - Automatic latency updates for all endpoints in a group
  - Latency display in endpoint lists and system tray
  - Connection success rate tracking

- **Database Management**:
  - Added database reset functionality
  - Improved database migration handling
  - Better error handling for database operations

#### Bug Fixes

- **Protocol Import**:
  - Fixed Hysteria2 protocol import issues
  - Improved protocol parsing and validation
  - Better error handling for invalid protocol URLs

- **Service Management**:
  - Fixed v2ray-core service start/stop not taking effect issues
  - Improved daemon state management
  - Better synchronization between UI state and actual service status
  - Fixed system tray service toggle reliability
  - Improved service status detection and updates

- **Configuration**:
  - Fixed inbound port changes not taking effect
  - Improved configuration reload mechanism
  - Better handling of configuration updates
  - Fixed port binding issues

- **System Tray**:
  - Fixed system tray menu update issues
  - Improved tray menu state synchronization
  - Better handling of user ID in tray operations
  - Fixed service status display in tray menu

- **Database Migration**:
  - Fixed database migration errors
  - Added automatic database reset mechanism for incompatible schema changes
  - Improved error messages for migration issues
  - Better handling of migration failures

#### Performance & Improvements

- Upgraded Rust packages for better performance and security
- Upgraded Node.js packages and dependencies
- Code refactoring and improvements for better maintainability
- Enhanced error handling throughout the application
- Improved overall code quality and stability
- Better logging and debugging capabilities

#### Technical Changes

- Enhanced database migration handling
- Improved system tray implementation
- Better error boundaries and error handling
- Updated dependencies across the project
- Improved protocol parsing and validation
- Enhanced configuration management

### Known Issues

- Window size on Windows does not remember its size (waiting for upstream fix).
- On Linux, the title bar buttons require enlarging the window before you can click to close or minimize.

---

## v0.5.1

### Important Notes

- If you encounter any issues, please go to Settings → Configuration Directory, back up your data, then delete all files and try again!
- After three months of intensive development and rigorous testing, the stable version v0.5.1 is finally released: significant improvements in performance and stability. Clash Verge Rev now boasts robustness comparable to cfw, while being more powerful and user-friendly!
- Due to changes in the service installation logic, the first installation on Mac/Linux requires entering the system password to uninstall and install the service. After that, you can seamlessly use TUN (virtual network card) mode.
- Due to a bug in Tauri 2.0, the webview process remains after closing the window. The advantage is that reopening the panel is faster, but the downside is a slight increase in memory usage.

### v0.5.1 Compared to 0.5.0

- **Added support for ARM64 architecture**:
  - Windows ARM64
  - Linux ARM64
- Fixed errors related to DNS, bypass, dual Monaco editors for PAC, and logic after updates.
- Enhanced overall styling for a more refined user interface.
- Corrected Windows CMD content errors that caused invalid proxy commands.

### v0.5.1 Compared to 0.4.6

- Improved robustness on macOS/Linux/Windows, fixing various service startup issues.
- Redesigned the interface, cleared many erroneous code logics from before, and improved user experience.

### Major Changes

- Major framework upgrade: migrated to Tauri 2.0 (significant improvements and performance enhancements).
- Submit issues to report bugs; no longer accepting bug reports for version 0.4.x.
- Strongly recommend completely uninstalling the old version 0.4.x before installing this version.

### Performance

- Optimized and refactored the kernel startup management logic.
- Optimized the system DNS settings logic.
- Bypass settings logic.
- PAC settings logic.

### Known Issues

- Window size on Windows does not remember its size (waiting for upstream fix).
- On Linux, the title bar buttons require enlarging the window before you can click to close or minimize.

I have finally completed the refactoring of the old version and migrated to the new framework. Although some features are still missing, this version should offer the best user experience. Come and try it out!
