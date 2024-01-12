import { Tray, MenuItemConstructorOptions, Menu, nativeImage, NativeImage } from 'electron';
import { template } from './template';

class TraySingleton {
  private static Instance: Tray | undefined;
  private template = template;

  constructor(arg: string | NativeImage) {
    if (!TraySingleton.Instance) {
      TraySingleton.Instance = new Tray(arg);
    }
    TraySingleton.Instance.setContextMenu(Menu.buildFromTemplate(this.template));
    return this;
  }
  public updateTemplate(replaceItem: MenuItemConstructorOptions) {
    this.template = this.template.map((i, idx) => {
      if (i.id === replaceItem.id) {
        return Object.assign(this.template[idx], replaceItem);
      }
      return i;
    });
  }
  public refreshTray() {
    TraySingleton.Instance?.setContextMenu(Menu.buildFromTemplate(this.template));
  }

  public updateMenuIcon(img: string): TraySingleton {
    const menuIcon = nativeImage.createFromDataURL(img);
    TraySingleton.Instance = new Tray(menuIcon);
    TraySingleton.Instance.setContextMenu(Menu.buildFromTemplate(this.template));
    return this;
  }
}

export { TraySingleton };
