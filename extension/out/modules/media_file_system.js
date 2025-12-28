'use strict';

const vscode = require('vscode');
const { MEDIA_VIEW_ID } = require('./constants.js');

/**
 * MediaFileSystem - 媒体文件系统提供者
 * 
 * 实现了 VSCode 的 FileSystemProvider 接口，用于管理虚拟的媒体文件。
 * 支持创建、读取、删除媒体文件（如图片），这些文件存储在内存中。
 */
class MediaFileSystem {
  constructor() {
    this.fileEntries = new Map();
    this._emitter = new vscode.EventEmitter();
    this.onDidChangeFile = this._emitter.event;
  }

  static _instance = null;

  static getInstance() {
    if (!MediaFileSystem._instance) {
      MediaFileSystem._instance = new MediaFileSystem();
    }
    return MediaFileSystem._instance;
  }

  /**
   * 将 URI 转换为 media view 的 URI
   */
  uriConverter(uri) {
    return uri.with({
      scheme: MEDIA_VIEW_ID
    });
  }

  /**
   * 创建文件并触发文件创建事件
   */
  createFile(uri, content) {
    let convertedUri = this.uriConverter(uri);
    this.fileEntries.set(convertedUri.fsPath, content);
    this._emitter.fire([{
      type: vscode.FileChangeType.Created,
      uri: convertedUri
    }]);
  }

  /**
   * 读取文件内容（从 base64 解码）
   */
  readFile(uri) {
    let convertedUri = this.uriConverter(uri);
    let content = this.fileEntries.get(convertedUri.fsPath);
    if (!content) {
      throw new Error("File not found");
    }
    return Buffer.from(content, 'base64');
  }

  /**
   * 写文件（空实现，因为是只读文件系统）
   */
  writeFile() {}

  /**
   * 获取文件状态
   */
  stat(uri) {
    let convertedUri = this.uriConverter(uri);
    if (!this.fileEntries.has(convertedUri.fsPath)) {
      throw new Error('File not found');
    }
    return {
      type: vscode.FileType.File,
      ctime: Date.now(),
      mtime: Date.now(),
      size: this.fileEntries.get(convertedUri.fsPath)?.length ?? 0
    };
  }

  /**
   * 删除文件并触发文件删除事件
   */
  delete(uri) {
    let convertedUri = this.uriConverter(uri);
    this.fileEntries.delete(convertedUri.fsPath);
    this._emitter.fire([{
      type: vscode.FileChangeType.Deleted,
      uri: convertedUri
    }]);
  }

  /**
   * 监听文件变化（返回空的 Disposable）
   */
  watch() {
    return new vscode.Disposable(() => {});
  }

  /**
   * 重命名（空实现）
   */
  rename() {}

  /**
   * 创建目录（空实现）
   */
  createDirectory() {}

  /**
   * 读取目录（返回空数组）
   */
  readDirectory() {
    return [];
  }
}

module.exports = {
  MediaFileSystem
};

