import { app, BrowserWindow, dialog } from 'electron';
import path from 'path';

import { ElectronApp } from '@main/app';
//
const tasks: Array<(electronApp: ElectronApp) => void> = [];

// const test = (electronApp: ElectronApp) => {
//
//   electronApp.registryHooksAsyncWhenReady('electronReServiceTest', async () => {
//     console.log('hooks: >> electronReServiceTest');
//     try {
//
//     } catch (error) {
//       console.trace(error);
//     }
//   });
// };

// const setAsDefaultProtocolClient = () => {
//   const args = [];
//
//   const addServerConfirm = (url: string) => {
//     dialog
//       .showMessageBox({
//         type: "info",
//         message: `${i18n.__('would_you_want_to_add_the_server')}\n${url}`,
//         buttons: [i18n.__('confirm'), i18n.__('cancel')],
//         defaultId: 0,
//       })
//       .then(({ response }) => {
//         if (response === 0) {
//           ((global as any).win as BrowserWindow).show();
//           (global as any).win.webContents.send("event:stream", {
//             action: "add-server",
//             args: url,
//           });
//         }
//       })
//       .catch((e) => console.log(e));
//   };
//
//   const handleUrl = (url: string) => {
//     if (!app.isReady()) {
//       app.once('ready', async () => {
//         await new Promise((resolve) => setTimeout(resolve, 2e3));
//         addServerConfirm(url);
//       });
//     } else {
//       addServerConfirm(url);
//     }
//   };
//
//   const handleArgv = (argv: string[]) => {
//     const offset = app.isPackaged ? 1 : 2;
//     const url = argv.find((arg, i) => {
//       return i >= offset && (arg.startsWith(ssPrefix) || arg.startsWith(ssrPrefix));
//     });
//     if (url) handleUrl(url);
//   };
//
//   if (electronIsDev) args.push(path.resolve(process.argv[1]));
//   args.push("--");
//
//   if (!app.isDefaultProtocolClient(ssrProtocol)) {
//     app.setAsDefaultProtocolClient(ssrProtocol, process.execPath, args);
//   }
//   if (!app.isDefaultProtocolClient(ssProtocol)) {
//     app.setAsDefaultProtocolClient(ssProtocol, process.execPath, args);
//   }
//
//   handleArgv(process.argv);
//
//   // Windows, Not supported on Linux
//   app.on("second-instance", (event, argv) => {
//     if (process.platform === "win32") {
//       handleArgv(argv);
//     }
//   });
//
//   // macOS
//   app.on("open-url", (event, urlStr) => {
//     handleUrl(urlStr);
//   });
// };

tasks.push();

export default (electronApp: ElectronApp) => {
  tasks.forEach((task) => {
    task(electronApp);
  });
};
