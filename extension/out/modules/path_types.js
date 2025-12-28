'use strict';

const path = require('path');
const { lstat } = require('fs/promises');
const vscode = require('vscode');
const { Logger } = require('./logger.js');

/**
 * 平台类型枚举
 */
const PlatformType = {
  POSIX: 0,
  WINDOWS: 1
};

/**
 * 文件路径基类
 * 提供跨平台的路径处理功能
 */
class FilePath {
  constructor(absolutePath, isDirectory, platformType) {
    this._absolutePath = absolutePath;
    this._isDirectory = isDirectory;
    this._platform = platformType;
    this._path = platformType === PlatformType.WINDOWS ? path.win32 : path.posix;
  }

  static getAbsolutePath(filePathObj, platformType) {
    return filePathObj ? FilePath.normalizeToPlatformPath(filePathObj.absolutePath, platformType) : '';
  }

  static equals(pathA, pathB) {
    return pathA.absPath === pathB.absPath;
  }

  static includes(pathArray, pathToFind) {
    return pathArray.some(pathItem => FilePath.equals(pathItem, pathToFind));
  }

  static getFileName(filePath, platformType) {
    let normalizedPath = this.normalizeToPlatformPath(filePath, platformType);
    return (platformType === PlatformType.WINDOWS ? path.win32 : path.posix).basename(normalizedPath);
  }

  static normalizeToPlatformPath(pathStr, platformType) {
    return platformType === PlatformType.WINDOWS ? path.win32.normalize(pathStr) : path.posix.normalize(pathStr);
  }

  get isDirectory() {
    return this._isDirectory;
  }

  get platform() {
    return this._platform;
  }

  get absPath() {
    return this._absolutePath;
  }

  get name() {
    return this._path.basename(this.absPath);
  }

  get proto() {
    return {
      absolutePath: this.absPath,
      isDirectory: this.isDirectory
    };
  }

  get tiptapState() {
    return {
      id: this.absPath,
      label: this.name,
      absolutePath: this.absPath
    };
  }

  static EMPTY_WORKSPACE = '';
}

/**
 * Traycer 路径类
 * 扩展 FilePath，添加工作区相关功能
 */
class TraycerPath extends FilePath {
  static _getPlatform() {
    return process.platform === 'win32' ? PlatformType.WINDOWS : PlatformType.POSIX;
  }

  static async _isDirectory(pathToCheck) {
    try {
      return (await lstat(pathToCheck)).isDirectory();
    } catch (error) {
      Logger.debug("Error checking if path is directory: " + pathToCheck, error);
      return false;
    }
  }

  static fromPathProto(pathProto) {
    if (!pathProto) throw new Error('PathProto is null');
    let platform = TraycerPath._getPlatform();
    return new TraycerPath(pathProto.absolutePath, pathProto.isDirectory, platform);
  }

  get absUri() {
    return vscode.Uri.file(this.absPath);
  }

  get workspacePath() {
    let workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      throw new Error('No workspace folders found');
    }
    let matchingFolder = workspaceFolders.find(folder => this.absPath.startsWith(folder.uri.fsPath));
    return matchingFolder ? matchingFolder.uri.fsPath : TraycerPath.EMPTY_WORKSPACE;
  }

  get workspaceUri() {
    return vscode.Uri.file(this.workspacePath);
  }

  get relPath() {
    return path.relative(this.workspacePath, this.absPath);
  }

  serializeToStorage() {
    return {
      absolutePath: this.absPath,
      isDirectory: this._isDirectory
    };
  }

  serializeToWire() {
    return {
      absolutePath: this.absPath,
      isDirectory: this._isDirectory
    };
  }

  static pathEquals(path1, path2) {
    let platform = TraycerPath._getPlatform();
    let normalizedPath1 = TraycerPath.normalizeToPlatformPath(path1, platform);
    let normalizedPath2 = TraycerPath.normalizeToPlatformPath(path2, platform);
    return normalizedPath1.toLocaleLowerCase() === normalizedPath2.toLocaleLowerCase();
  }

  static deserializeFromStorage(storedPath) {
    return TraycerPath.fromPathProto(storedPath);
  }

  static deserializeFromWire(wirePath) {
    return TraycerPath.fromPathProto(wirePath);
  }

  static normalizePath(inputPath) {
    return TraycerPath._getPlatform() === PlatformType.WINDOWS 
      ? path.win32.normalize(inputPath) 
      : path.posix.normalize(inputPath);
  }

  static findWorkspaceForPath(absolutePath) {
    let workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) return null;
    for (let folder of workspaceFolders) {
      let folderPath = folder.uri.fsPath;
      if (absolutePath.startsWith(folderPath)) return folderPath;
    }
    return null;
  }

  static getRelativePath(inputPath) {
    let normalizedPath = TraycerPath.normalizePath(inputPath);
    let workspacePath = TraycerPath.findWorkspaceForPath(normalizedPath);
    return workspacePath ? path.relative(workspacePath, normalizedPath) : normalizedPath;
  }

  static async fromPath(inputPath) {
    let normalizedPath = TraycerPath.normalizePath(inputPath);
    let isDir = await TraycerPath._isDirectory(normalizedPath);
    return new TraycerPath(normalizedPath, isDir, TraycerPath._getPlatform());
  }

  static async pathExistsInWorkspace(pathProto) {
    let absolutePath = pathProto.absolutePath;
    let normalizedPath = TraycerPath.normalizePath(absolutePath);
    return TraycerPath.findWorkspaceForPath(normalizedPath) !== null;
  }

  static EMPTY_WORKSPACE = "EMPTY_WORKSPACE";
}

module.exports = {
  PlatformType,
  FilePath,
  TraycerPath
};

