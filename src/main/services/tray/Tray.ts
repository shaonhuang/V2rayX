import { Tray, MenuItemConstructorOptions, Menu, nativeImage, NativeImage } from 'electron';

import { template } from './template';

class TraySingleton {
  private Instance: Tray | undefined;
  private template = template;

  constructor(arg: string | NativeImage) {
    if (!this.Instance) {
      this.Instance = new Tray(arg);
      this.Instance.setContextMenu(Menu.buildFromTemplate(this.template));
    }
    this.template = template;
    return this;
  }
  public updateTemplate(replaceItem: MenuItemConstructorOptions) {
    this.template = this.template.map((i) => {
      if (i.id === replaceItem.id) {
        return replaceItem;
      }
      return i;
    });
  }
  public refreshTray() {
    this.Instance?.setContextMenu(Menu.buildFromTemplate(this.template));
  }

  public updateMenuIcon(img: string): TraySingleton {
    const menuIcon = nativeImage.createFromDataURL(img);
    this.Instance = new Tray(menuIcon);
    this.Instance.setContextMenu(Menu.buildFromTemplate(this.template));
    return this;
  }
}

export { TraySingleton };
