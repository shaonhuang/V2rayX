import { app, ipcMain } from 'electron';
import fs from 'node:fs';
import { join } from 'node:path';
import { filter, find, escapeRegExp } from 'lodash';

const listeners = () => {
  ipcMain.handle('get-logs-path', () => {
    return app.getPath('logs');
  });

  ipcMain.on('logs:get', (event, logName = 'access.log') => {
    const logPath = join(app.getPath('logs'), logName);
    const logs = fs.existsSync(logPath)
      ? fs.readFileSync(logPath, 'utf-8').split('\n').slice(-11, -1)
      : [];
    event.reply('logs:get', logs);
  });

  ipcMain.on('logs:getAllError', (event, { path, start, size, filters, globalFilter, sorting }) => {
    if (!start) return;
    const logPath = path;
    const logs = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf-8').split('\n') : [];
    const filteredLogs = filter(
      logs
        .filter((i) => i.includes(globalFilter) || globalFilter === '')
        .reverse()
        .map((i) => {
          const [errorDate, errorTime, errorType] = i.split(' ');
          const errorContent = i.split(' ').slice(3).join(' ');
          return {
            errorDate,
            errorTime,
            errorType,
            errorContent,
          };
        }),
      (i: any) => {
        const filtersObj = JSON.parse(filters);
        const patternErrorDate = new RegExp(
          escapeRegExp(find(filtersObj, { id: 'errorDate' })?.value) || /.*/,
          'i',
        );
        const patternErrorTime = new RegExp(
          escapeRegExp(find(filtersObj, { id: 'errorTime' })?.value) || /.*/,
          'i',
        );
        const patternErrorType = new RegExp(
          escapeRegExp(find(filtersObj, { id: 'errorType' })?.value) || /.*/,
          'i',
        );
        const patternErrorContent = new RegExp(
          escapeRegExp(find(filtersObj, { id: 'errorContent' })?.value) || /.*/,
          'i',
        );
        const preTest =
          patternErrorDate.test(i.errorDate) &&
          patternErrorTime.test(i.errorTime) &&
          patternErrorType.test(i.errorType) &&
          patternErrorContent.test(i.errorContent);
        return preTest;
      },
    );
    event.reply('logs:getAllError', {
      data: filteredLogs.slice(start, start + size).filter((i) => i.errorContent),
      meta: {
        totalRowCount: filteredLogs.length,
        path,
        start,
        size,
        filters,
        globalFilter,
        sorting,
      },
    });
  });

  ipcMain.on('logs:getAll', (event, { path, start, size, filters, globalFilter, sorting }) => {
    if (!start) return;
    const logPath = path;
    const logs = fs.existsSync(logPath) ? fs.readFileSync(logPath, 'utf-8').split('\n') : [];
    const filteredLogs = filter(
      logs
        .filter((i) => i.includes(globalFilter) || globalFilter === '')
        .reverse()
        .map((i) => {
          const [date, time, address, type, content, level] = i.split(' ');
          return {
            date,
            time,
            address,
            type,
            content,
            level,
          };
        }),
      (i: any) => {
        const filtersObj = JSON.parse(filters);
        const patternDate = new RegExp(
          escapeRegExp(find(filtersObj, { id: 'date' })?.value) || /.*/,
          'i',
        ); // case insensitive
        const patternAddress = new RegExp(
          escapeRegExp(find(filtersObj, { id: 'address' })?.value) || /.*/,
          'i',
        );
        const patternTime = new RegExp(
          escapeRegExp(find(filtersObj, { id: 'time' })?.value) || /.*/,
          'i',
        );
        const patternType = new RegExp(
          escapeRegExp(find(filtersObj, { id: 'type' })?.value) || /.*/,
          'i',
        );
        const patternContent = new RegExp(
          escapeRegExp(find(filtersObj, { id: 'content' })?.value) || /.*/,
          'i',
        );
        const patternLevel = new RegExp(
          escapeRegExp(find(filtersObj, { id: 'level' })?.value) || /.*/,
          'i',
        );
        const preTest =
          patternDate.test(i.date) &&
          patternAddress.test(i.address) &&
          patternTime.test(i.time) &&
          patternType.test(i.type) &&
          patternContent.test(i.content) &&
          patternLevel.test(i.level);

        return preTest;
      },
    );
    event.reply('logs:getAll', {
      data: filteredLogs.slice(start, start + size).filter((i) => i.content),
      meta: {
        totalRowCount: filteredLogs.length,
        path,
        start,
        size,
        filters,
        globalFilter,
        sorting,
      },
    });
  });
};

export default listeners;
