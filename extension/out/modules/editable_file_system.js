'use strict';

const vscode_module = require("vscode");
const { T0 } = require("./prompt_template.js");
const { EDITABLE_DIFF_VIEW_ID } = require("./constants.js");

/**
 * 可编辑差异视图文件系统提供者
 * 继承自 T0 基础文件系统类，用于支持可编辑的 diff 视图
 */
class EditableFileSystem extends T0 {
  static _instance = null;

  constructor(uriConverter, context) {
    super(uriConverter);
    
    // 监听文件变更事件
    let fileChangeDisposable = this.onDidChangeFile(async changes => {
      for (let change of changes) {
        if (this.fileEntries.has(change.uri.toString())) {
          await this.fileEntries.get(change.uri.toString())?.['fileChangeCallback']?.(change);
        }
      }
    });
    
    context.subscriptions.push(fileChangeDisposable);
  }

  /**
   * 获取 EditableFileSystem 单例实例
   * @param {vscode.ExtensionContext} context - VSCode 扩展上下文（首次调用时必需）
   * @returns {EditableFileSystem}
   */
  static getInstance(context) {
    if (!EditableFileSystem._instance) {
      if (!context) {
        throw new Error("Context is required to construct the editable file system provider");
      }
      
      EditableFileSystem._instance = new EditableFileSystem(
        uri => uri.with({ scheme: EDITABLE_DIFF_VIEW_ID }),
        context
      );
    }
    
    return EditableFileSystem._instance;
  }

  /**
   * 创建文件
   * @param {vscode.Uri} uri - 文件 URI
   * @param {string} content - 文件内容
   * @param {Function} fileChangeCallback - 文件变更回调函数
   */
  createFile(uri, content, fileChangeCallback) {
    let convertedUri = this.uriConverter(uri);
    
    this.fileEntries.set(convertedUri.toString(), {
      content: Buffer.from(content).toString('utf8'),
      fileChangeCallback: fileChangeCallback
    });
    
    this._emitter.fire([{
      type: vscode_module.FileChangeType.Created,
      uri: convertedUri
    }]);
  }

  /**
   * 写入文件
   * @param {vscode.Uri} uri - 文件 URI
   * @param {Uint8Array} content - 文件内容
   */
  writeFile(uri, content) {
    let convertedUri = this.uriConverter(uri);
    let existingEntry = this.fileEntries.get(convertedUri.toString());
    
    if (existingEntry) {
      this.fileEntries.set(convertedUri.toString(), {
        content: Buffer.from(content).toString("utf8"),
        fileChangeCallback: existingEntry.fileChangeCallback
      });
      
      this._emitter.fire([{
        type: vscode_module.FileChangeType.Changed,
        uri: convertedUri
      }]);
    }
  }
}

// CommonJS 导出
module.exports = {
  EditableFileSystem
};

