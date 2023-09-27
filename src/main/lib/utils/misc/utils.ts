// copy code need to be tide up

import path from 'path';
import fs, { PathLike } from 'fs';
import os from 'os';
import { exec, ExecOptions } from 'child_process';
import { Config } from '@lib/constant/types';
import { archMap, getPathRuntime, pathExecutable } from '@lib/constant';

import { screen } from 'electron';
import logger from '@lib/logs';

export const getPluginsPath = (name = '', useArch?: string) => {
  const arch = useArch || os.arch();
  if (archMap.has(arch)) {
    switch (os.platform()) {
      case 'linux':
        return getPathRuntime(`bin/linux/${archMap.get(arch)}/${name}`);
      case 'darwin':
        return getPathRuntime(`bin/darwin/${archMap.get(arch)}/${name}`);
      case 'win32':
        return getPathRuntime(`bin/win32/${archMap.get(arch)}/${name ? `${name}.exe` : ''}`);
      default:
        return name;
    }
  } else {
    return name;
  }
};

/**
 * getExecutableFilePath
 * @param name fileName
 * @returns filePath
 */
export const getExecutableFilePath = (name: string, useArch?: string) => {
  const arch = useArch || os.arch();
  if (archMap.has(arch)) {
    switch (os.platform()) {
      case 'linux':
        return path.join(pathExecutable, `bin/linux/${archMap.get(arch)}/${name}`);
      case 'darwin':
        return path.join(pathExecutable, `bin/darwin/${archMap.get(arch)}/${name}`);
      case 'win32':
        return path.join(
          pathExecutable,
          `bin/win32/${archMap.get(arch)}/${name ? `${name}.exe` : ''}`,
        );
      default:
        return name;
    }
  } else {
    return name;
  }
};

/**
 * copyFileToPluginDir
 * @param name Plugin Name
 * @param srcFile Plugin File Path
 */
export const copyFileToPluginDir = (name: string, srcFile: PathLike) => {
  fs.copyFile(srcFile, getPluginsPath(name), (err) => {
    if (err) {
      logger.error(err);
    }
  });
};

export const getEncryptMethod = (config: Config): string => {
  if (config.type === 'ss') return config.encryptMethod ?? '';
  if (config.type === 'ssr') {
    if (config.encryptMethod === 'none') return config.protocol ?? '';
    return config.encryptMethod ?? '';
  }
  return '';
};

/**
 * checkEnvFiles [检查环境文件是否存在]
 * @author nojsja
 * @return {[type]} param [desc]
 */
export const checkEnvFiles = (
  args: { _path: string; isDir: boolean; checkEmpty?: boolean; exec?: () => void }[],
): void => {
  const check = function (params: {
    _path: string;
    isDir: boolean;
    checkEmpty?: boolean;
    exec?: () => void;
  }) {
    if (!fs.existsSync(params._path)) {
      if (params.isDir) {
        fs.mkdirSync(params._path);
      } else {
        fs.closeSync(fs.openSync(params._path, 'w'));
      }
      params.exec && params.exec();
    } else {
      if (params?.checkEmpty) {
        if (fs.readdirSync(params._path).length === 0) {
          params.exec && params.exec();
        }
      }
    }
  };

  args.forEach(check);
};

export const copyFileAsync = (src: string, dest: string) => {
  const readStream = fs.createReadStream(src);
  const writeStream = fs.createWriteStream(dest);
  readStream.pipe(writeStream);
};

export const copyFile = (srcFile: string, destFile: string) => {
  try {
    fs.writeFileSync(destFile, fs.readFileSync(srcFile));
  } catch (error) {
    console.error(error);
  }
};

/*
 * 同步复制目录、子目录，及其中的文件
 * @param src {String} 要复制的目录
 * @param dist {String} 复制到目标目录
 */
export const copyDir = (src: string, dist: string, callback?: (params: any) => void) => {
  let paths, stat;
  if (!fs.existsSync(dist)) {
    fs.mkdirSync(dist);
  }

  function _copy(src: string, dist: string) {
    paths = fs.readdirSync(src);
    paths.forEach(function (_path) {
      const _src = path.join(src, _path);
      const _dist = path.join(dist, _path);
      stat = fs.statSync(_src);
      // 判断是文件还是目录
      if (stat.isFile()) {
        copyFile(_src, _dist);
      } else if (stat.isDirectory()) {
        // 当是目录是，递归复制
        copyDir(_src, _dist, callback);
      }
    });
  }

  try {
    _copy(src, dist);
  } catch (error) {
    console.error(error);
  }
};

/*
 * 异步复制目录、子目录，及其中的文件
 * @param src {String} 要复制的目录
 * @param dist {String} 复制到目标目录
 */
export const copyDirAsync = (src: string, dist: string, callback?: (params: any) => void) => {
  fs.access(dist, function (err) {
    if (err) {
      // 目录不存在时创建目录
      fs.mkdirSync(dist);
    }
    _copy(null, src, dist);
  });

  function _copy(err: Error | null, src: string, dist: string) {
    if (err) {
      callback && callback(err);
    } else {
      fs.readdir(src, function (err, paths) {
        if (err) {
          callback && callback(err);
        } else {
          paths.forEach(function (path) {
            const _src = src + '/' + path;
            const _dist = dist + '/' + path;
            fs.stat(_src, function (err, stat) {
              if (err) {
                callback && callback(err);
              } else {
                // 判断是文件还是目录
                if (stat.isFile()) {
                  fs.writeFileSync(_dist, fs.readFileSync(_src));
                } else if (stat.isDirectory()) {
                  // 当是目录是，递归复制
                  copyDir(_src, _dist, callback);
                }
              }
            });
          });
        }
      });
    }
  }
};

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

/**
 * [fsChmod 对文件和文件夹递归授予权限]
 * @param  {[String]} dir   [文件夹]
 * @param  {[int]} opstr [八进制数字，例如0o711]
 */
export const chmod = (target: string, opstr: number) => {
  if (fs.statSync(target).isDirectory()) {
    const files = fs.readdirSync(target);
    if (files.length) {
      files.forEach((file) => {
        chmod(path.join(target, file), opstr);
      });
    }
  } else {
    if (target && !target.includes('.gitignore')) {
      console.log(`fs.chmod => ${target} with ${opstr}`);
      fs.chmodSync(target, opstr);
    }
  }
};

/**
 * @name getPerfectDevicePixelRatioImage 生成适配屏幕缩放比的图片路径
 * @param { string } imageFullPath 图片的完整路径
 * @param { number[] } availableRatio 可用的缩放比例
 * @param { boolean } pixelFixedUp 当屏幕缩放比为小数时是否强制向上取整
 * @returns { string } 适配了屏幕最最佳缩放比例的的图片路径
 */
export const getPerfectDevicePixelRatioImage = (
  imageFullPath: string,
  availableRatio: number[] = [1],
  pixelFixedUp = true,
) => {
  const { scaleFactor } = screen.getPrimaryDisplay();
  const scaleFactorInteger = pixelFixedUp ? Math.round(scaleFactor) : Math.floor(scaleFactor);
  const imageName = path.normalize(imageFullPath).split(path.sep).pop() ?? imageFullPath;
  const imageExt = path.extname(imageName);
  const imageBase = path.basename(imageFullPath, imageExt);
  const availableRatioSorted = pixelFixedUp
    ? availableRatio.sort()
    : availableRatio.sort().reverse();

  const perfectFactor =
    availableRatioSorted.find((factor) => factor === scaleFactor || factor === scaleFactorInteger) ||
    availableRatio[0];

  if (perfectFactor === 1) return imageFullPath;

  return imageFullPath.replace(imageName, `${imageBase}@${perfectFactor}x${imageExt}`);
};
