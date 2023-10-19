import { exec, ExecOptions } from 'child_process';
import * as net from 'net';

export const execAsync = (command: string, options?: ExecOptions) => {
  return new Promise<{
    code: number;
    stdout?: string;
    stderr?: string;
  }>((resolve, reject) => {
    exec(command, { ...options, windowsHide: true }, (err, stdout, stderr) => {
      if (!stderr) {
        resolve({
          code: err ? 1 : 0,
          stdout,
        });
      } else {
        reject({
          code: err ? 1 : 0,
          stderr,
        });
      }
    });
  });
};

export const checkPortAvailability = (port: number) => {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        reject(`Port ${port} is already in use`);
      } else {
        reject(err);
      }
    });

    server.listen(port, () => {
      server.close(() => {
        resolve(`Port ${port} is available`);
      });
    });
  });
};

export const promiseRetry = <T>(
  promiseFn: () => Promise<T>,
  maxAttempts: number,
  delay: number,
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const attempt = (currentAttempt: number) => {
      promiseFn()
        .then(resolve)
        .catch((error) => {
          if (currentAttempt < maxAttempts) {
            setTimeout(() => attempt(currentAttempt + 1), delay);
          } else {
            reject(error);
          }
        });
    };

    attempt(1);
  });
};
