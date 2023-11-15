import tapable, { SyncHook, AsyncParallelHook } from 'tapable';

export interface ElectronApp {
  hooks: {
    beforeReady: SyncHook<unknown, void, tapable.UnsetAdditionalOptions>;
    ready: SyncHook<unknown, void, tapable.UnsetAdditionalOptions>;
    afterReady: AsyncParallelHook<unknown, tapable.UnsetAdditionalOptions>;
    beforeQuit: AsyncParallelHook<unknown, tapable.UnsetAdditionalOptions>;
  };
  registryHooksSync: (point: LifeCycles, name: string, fn: (args_0: any) => void) => void;
  registryHooksAsyncWhenReady: (name: string, fn: (args_0: any, callback: Function) => void) => void;
  registryHooksAsyncBeforeQuit: (
    name: string,
    fn: (args_0: any, callback: Function) => void,
  ) => void;
  beforeReady: (app: Electron.App) => void;
  ready: (app: Electron.App) => void;
  afterReady: (app: Electron.App, callback: (err: Error | null, app: Electron.App) => void) => void;
  beforeQuit: (app: Electron.App, callback: (err: Error | null, app: Electron.App) => void) => void;
}

export type LifeCycles = 'beforeReady' | 'ready' | 'afterReady' | 'beforeQuit';

export default class App implements ElectronApp {
  hooks = {
    beforeReady: new SyncHook(['app']),
    ready: new SyncHook(['app']),
    afterReady: new AsyncParallelHook(['app']),
    beforeQuit: new AsyncParallelHook(['app']),
  };
  lifeCycles: LifeCycles[] = ['beforeReady', 'ready', 'afterReady', 'beforeQuit'];

  registryHooksSync(point: LifeCycles, name: string, fn: (args_0: any) => void) {
    this.hooks[point].tap(name, fn);
  }

  registryHooksAsyncWhenReady(name: string, fn: (args_0: any, callback: Function) => void) {
    this.hooks.afterReady.tapAsync(name, fn);
  }

  registryHooksAsyncBeforeQuit(name: string, fn: (args_0: any, callback: Function) => void) {
    this.hooks.beforeQuit.tapAsync(name, fn);
  }

  beforeReady(app: Electron.App) {
    this.hooks.beforeReady.call(app);
  }

  ready(app: Electron.App) {
    this.hooks.ready.call(app);
  }

  afterReady(app: Electron.App, callback: (err: Error | null, app: Electron.App) => void) {
    this.hooks.afterReady.callAsync(app, (err) => {
      if (err) return callback(err, app);
      callback(null, app);
    });
  }

  beforeQuit(app: Electron.App, callback: (err: Error | null, app: Electron.App) => void) {
    this.hooks.beforeQuit.callAsync(app, (err) => {
      if (err) return callback(err, app);
      callback(null, app);
    });
  }
}
