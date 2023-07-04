import { app, BrowserWindow, Tray, Menu, nativeImage } from 'electron';
let tray: any = null;

export const createTray = (mainWindow: Object, createWindow: Function) => {
  const menuIcon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAASpJREFUOE+lk7FKA0EQhv85FSuLu/MRXAJqKTY2prZII4KtlazY2oiQSsgDZE8LX8BYiC9ginRWFhHC3htoNhFbb0cuGrnoeXuH2+3y/98M/84Q/nko9YftuMXEJxVYfbC9MUe15gQQqPgRHu+bQ/E0uV/oVVj0i4AMdEdS1L8AmqdiI8Wvt79AqdYJYMYzgA5bdMbHopvp8NpIse4EfFanByNXNv0o3iLmXrbbMoBx8o4Nu2hfFxLqAVSrBPCAxosUd34U3xJzI5uHMwMCTodSnIdR3GLmHXjY+/4ppbkQECqthlLIINIHYFz9rBy4AKkhL7QpyAlYuhws54WWGgtDtAnq83P0lhDO8kLLnQNf6XsCtivsAmZHuT1ogrxdAGslIbPLVNKUK/sAFubAEc0R7fYAAAAASUVORK5CYII='
  );
  tray = new Tray(menuIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Window',
      click: () => {
        if (mainWindow === null) {
          createWindow();
        } else {
          if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
          } else {
            mainWindow.show();
          }
        }
      },
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      },
    },
  ]);
  tray.setToolTip('This is my application.');
  tray.setContextMenu(contextMenu);
};
