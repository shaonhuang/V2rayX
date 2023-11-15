import { ElectronApp } from '@main/app';
const tasks: Array<(electronApp: ElectronApp) => void> = [];

tasks.push();

export default (electronApp: ElectronApp) => {
  tasks.forEach((task) => {
    task(electronApp);
  });
};
