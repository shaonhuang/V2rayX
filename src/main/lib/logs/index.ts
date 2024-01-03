import path from 'node:path';
import { app } from 'electron';
import winston, { format } from 'winston';
import open from 'open';
import DailyRotateFile from 'winston-daily-rotate-file';
import chalk from 'chalk';
import fs, { existsSync } from 'node:fs';
import { appDataPath } from '@lib/constant';

const { combine, simple, colorize } = format;
const configPath = path.join(appDataPath, 'lowdb', 'db.json');
export const logDir = (() => {
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const targetPath = config?.management?.generalSettings?.applicationLogsFolder;
    if (config && targetPath) {
      if (existsSync(targetPath)) {
        return targetPath;
      }
    }
  }
  return app.getPath('logs');
})();

export const openLogDir = async () => {
  await open(logDir);
};

export const cleanLogs = () => {
  console.log('clean logs');
};

const timestamp = format((info) => {
  info.message = `${new Date().toLocaleString()} - ${info.message}`;
  return info;
});

const dailyTransport: DailyRotateFile = new DailyRotateFile({
  filename: path.resolve(logDir, 'v2rayx-electron-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: false,
  maxSize: '10m',
  maxFiles: '30d',
});

const logger = winston.createLogger({
  level: 'info',
  transports: [dailyTransport],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), simple()),
    }),
  );
}

export const warning = (...args: any) => console.log(chalk.yellow(...args));
export const error = (...args: any) => console.log(chalk.red(...args));
export const info = (...args: any) => console.log(chalk.green(...args));

warning.underline = (...args: any) => console.log(chalk.underline.yellow(...args));
warning.bold = (...args: any) => console.log(chalk.bold.yellow(...args));
error.underline = (...args: any) => console.log(chalk.underline.red(...args));
error.bold = (...args: any) => console.log(chalk.bold.red(...args));
info.underline = (...args: any) => console.log(chalk.underline.green(...args));
info.bold = (...args: any) => console.log(chalk.bold.green(...args));

export default logger;
