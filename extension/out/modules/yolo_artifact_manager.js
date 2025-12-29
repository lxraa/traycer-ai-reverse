'use strict';

const path_module = require("path");
const os_module = require("os");
const fs_promises_module = require("fs/promises");
const chokidar_module = require("chokidar");
const { Logger } = require("./logger.js");
const { FileSystemWatcher } = require("./file_system_watcher.js");

/**
 * 格式化错误信息为字符串
 */
function formatErrorToString(error) {
  return error instanceof Error 
    ? 'Error Name: ' + error.name + '\nError Message: ' + error.message + '\nError Stack: ' + error.stack 
    : '' + error;
}

/**
 * 确保目录存在，如果不存在则创建
 */
async function ensureDirectoryExists(directoryPath) {
  try {
    await fs_promises_module.stat(directoryPath);
  } catch (statError) {
    Logger.debug('Creating folder: ' + directoryPath, formatErrorToString(statError));
    try {
      await fs_promises_module.mkdir(directoryPath, {
        recursive: true
      });
    } catch (mkdirError) {
      if (mkdirError.code !== "EEXIST") {
        Logger.warn("Failed to create folder: " + directoryPath, mkdirError);
        throw mkdirError;
      }
    }
  }
}

/**
 * Yolo Artifact 管理器
 * 单例模式,用于监视和管理 Yolo 生成的构件文件
 */
class YoloArtifactManager {
  constructor() {
    this.activeWatchers = new Map();
    this.artifactDirectory = path_module.join(
      os_module.homedir(),
      ".traycer",
      "yolo_artifacts"
    );
  }

  static instance = null;

  /**
   * 获取单例实例
   */
  static getInstance() {
    if (!YoloArtifactManager.instance) {
      YoloArtifactManager.instance = new YoloArtifactManager();
    }
    return YoloArtifactManager.instance;
  }

  /**
   * 获取构件目录路径
   */
  getArtifactDirectory() {
    return this.artifactDirectory;
  }

  /**
   * 初始化构件管理器
   */
  async initialize() {
    await ensureDirectoryExists(this.artifactDirectory);
    Logger.debug(
      "ArtifactFileWatcher initialized with directory: " + this.artifactDirectory
    );
  }

  /**
   * 监视特定构件的创建
   * @param {string} artifactId - 构件ID
   * @param {Function} callback - 检测到构件时的回调函数
   * @param {number} timeout - 超时时间(毫秒)
   */
  async watchForArtifact(artifactId, callback, timeout) {
    if (!artifactId || artifactId.trim() === '') {
      throw new Error("Artifact ID cannot be empty");
    }

    if (this.activeWatchers.has(artifactId)) {
      throw new Error("Watcher already exists for artifact: " + artifactId);
    }

    await ensureDirectoryExists(this.artifactDirectory);

    return Promise.race([
      this.createWatcherPromise(artifactId, callback),
      this.createTimeoutPromise(artifactId, timeout)
    ]);
  }

  /**
   * 创建超时 Promise
   */
  createTimeoutPromise(artifactId, timeout) {
    return new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          await this.cleanupWatcher(artifactId);
        } catch {}
        reject(
          new Error(
            "Timeout waiting for artifact " +
              artifactId +
              ' after ' +
              timeout / 1000 +
              " seconds"
          )
        );
      }, timeout);
    });
  }

  /**
   * 创建文件监视 Promise
   */
  createWatcherPromise(artifactId, callback) {
    return new Promise((resolve, reject) => {
      let filePath = path_module.join(
        this.artifactDirectory,
        artifactId + ".json"
      );

      let watcher = chokidar_module.watch(filePath, {
        ignoreInitial: false,
        persistent: true,
        awaitWriteFinish: {
          stabilityThreshold: 500,
          pollInterval: 100
        }
      });

      let hasProcessed = false;

      watcher.on('add', async () => {
        if (hasProcessed) return;
        hasProcessed = true;

        let error = null;
        try {
          await callback();
        } catch (err) {
          Logger.error(err, "Error in artifact callback for " + artifactId);
          error = err;
        } finally {
          try {
            await this.cleanupWatcher(artifactId);
          } catch {}
          try {
            await this.deleteArtifactFile(artifactId);
          } catch (deleteErr) {
            Logger.debug(
              deleteErr instanceof Error ? deleteErr.message : String(deleteErr),
              "Delete artifact file skipped or failed for " + artifactId
            );
          }
        }

        if (error) {
          reject(error);
        } else {
          Logger.debug('Artifact ' + artifactId + ' detected');
          resolve();
        }
      });

      watcher.on('error', async (err) => {
        if (!hasProcessed) {
          hasProcessed = true;
          try {
            await this.cleanupWatcher(artifactId);
          } catch {}
          reject(err);
        }
      });

      this.activeWatchers.set(artifactId, watcher);
      Logger.debug(
        'Started watching for artifact: ' + artifactId + " at " + filePath
      );
    });
  }

  /**
   * 清理监视器
   */
  async cleanupWatcher(artifactId) {
    let watcher = this.activeWatchers.get(artifactId);
    if (!watcher) {
      throw new Error('No watcher found for artifact ID: ' + artifactId);
    }

    watcher.emit('error', 'Watcher closed');
    await watcher.close();
    this.activeWatchers.delete(artifactId);
    Logger.debug('Cleaned up watcher for artifact: ' + artifactId);
  }

  /**
   * 删除构件文件
   */
  async deleteArtifactFile(artifactId) {
    let filePath = path_module.join(
      this.artifactDirectory,
      artifactId + '.json'
    );

    try {
      await fs_promises_module.unlink(filePath);
      Logger.debug('Deleted artifact file: ' + filePath);
    } catch (err) {
      if (
        err &&
        typeof err == 'object' &&
        'code' in err &&
        err.code === 'ENOENT'
      ) {
        Logger.debug('Artifact file already deleted or not found: ' + filePath);
      } else {
        throw err;
      }
    }
  }

  /**
   * 停止监视指定构件
   */
  async stopWatching(artifactId) {
    return this.cleanupWatcher(artifactId);
  }

  /**
   * 释放所有资源
   */
  async dispose() {
    let closePromises = Array.from(this.activeWatchers.values()).map(
      watcher => watcher.close()
    );
    await Promise.all(closePromises);
    this.activeWatchers.clear();
    Logger.debug("ArtifactFileWatcher disposed");
    YoloArtifactManager.instance = null;
  }
}

// CommonJS 导出
module.exports = {
  YoloArtifactManager
};

