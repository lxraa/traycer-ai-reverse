'use strict';

const vscode = require("vscode");
const { MediaFileSystem } = require("./media_file_system.js");
const { EditableFileSystem } = require("./editable_file_system.js");
const { TraycerFileSystem } = require("./prompt_template.js");

/**
 * 标签页变化监听器
 * 监听 VSCode 标签页的关闭事件，清理相关的虚拟文件系统
 */
class TabChangeWatcher {
  /**
   * 激活监听器
   * @param {vscode.ExtensionContext} context - VSCode 扩展上下文
   */
  activate(context) {
    this.tabChangeWatcher = vscode.window.tabGroups.onDidChangeTabs(event => {
      this.handleTabChangeEvent(event);
    });
    
    context.subscriptions.push(this.tabChangeWatcher);
  }
  
  /**
   * 停用监听器
   */
  deactivate() {
    this.tabChangeWatcher?.dispose();
  }
  
  /**
   * 处理标签页变化事件
   * @param {vscode.TabChangeEvent} tabChangeEvent - 标签页变化事件
   */
  handleTabChangeEvent(tabChangeEvent) {
    // 遍历所有关闭的标签页
    tabChangeEvent.closed.forEach(closedTab => {
      // 处理普通 URI (媒体文件)
      let tabUri = closedTab.input?.uri;
      if (tabUri instanceof vscode.Uri) {
        MediaFileSystem.getInstance().delete(tabUri);
      }
      
      // 处理 diff 视图 (可编辑文件系统和 Traycer 文件系统)
      let tabInput = closedTab.input;
      if (tabInput?.textDiffs?.length) {
        tabInput.textDiffs.forEach(textDiff => {
          // 检查 modified 和 original 是否都是 Uri
          if (!(textDiff?.modified instanceof vscode.Uri) || 
              !(textDiff?.original instanceof vscode.Uri)) {
            return;
          }
          
          // 删除可编辑文件系统和 Traycer 文件系统中的文件
          EditableFileSystem.getInstance().delete(textDiff.modified);
          TraycerFileSystem.getInstance().delete(textDiff.original);
        });
      }
    });
  }
}

module.exports = {
  TabChangeWatcher
};

