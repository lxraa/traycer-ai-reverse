'use strict';

const vscode = require("vscode");
const { FilePathHandler } = require("./file_path_handler.js");
const { WorkspaceInfoManager } = require("./workspace_info.js");

/**
 * 工作区监听器
 * 监听 VSCode 工作区文件夹的变化，清除相关缓存
 */
class WorkspaceWatcher {
  /**
   * 激活监听器
   * @param {vscode.ExtensionContext} context - VSCode 扩展上下文
   */
  activate(context) {
    this.workspaceChangeWatcher = vscode.workspace.onDidChangeWorkspaceFolders(
      event => this.handleWorkspaceChange()
    );
    
    context.subscriptions.push(this.workspaceChangeWatcher);
  }
  
  /**
   * 停用监听器
   */
  deactivate() {
    this.workspaceChangeWatcher?.dispose();
  }
  
  /**
   * 处理工作区变化
   * 清除文件路径缓存和工作区信息缓存
   */
  async handleWorkspaceChange() {
    FilePathHandler.getInstance().clearCache();
    WorkspaceInfoManager.getInstance().invalidateWSInfo();
  }
}

module.exports = {
  WorkspaceWatcher
};

