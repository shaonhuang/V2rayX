import { ElectronApp } from '@main/app';

const tasks: Array<(electronApp: ElectronApp) => void> = [];

const configureLanguage = (electronApp: ElectronApp) => {
  electronApp.registryHooksSync('ready', 'configureLanguage', () => {
    // console.log('hooks: >> configureLanguage');
  });
};

tasks.push(configureLanguage);

export default (electronApp: ElectronApp) => {
  tasks.forEach((task) => {
    task(electronApp);
  });
};
