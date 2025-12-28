'use strict';

const path_module = require("path");
const fs_promises_module = require("fs/promises");

// 常量
const EMPTY_FUNCTION = void 0;
const FROZEN_EMPTY_SET = Object.freeze(new Set());

/**
 * 文件系统监视器
 * 用于跟踪目录中的项目,并在目录为空时自动清理
 */
class FileSystemWatcher {
  constructor(path, removeWatcher) {
    this.path = path;
    this._removeWatcher = removeWatcher;
    this.items = new Set();
  }

  /**
   * 添加项目到监视列表
   */
  add(item) {
    let { items } = this;
    if (items && item !== '.' && item !== '..') {
      items.add(item);
    }
  }

  /**
   * 从监视列表中移除项目
   * 如果目录为空,自动清理监视器
   */
  async remove(item) {
    let { items } = this;
    if (!items) return;
    
    items.delete(item);
    if (items.size > 0) return;

    // 检查目录是否真的为空
    let dirPath = this.path;
    try {
      await fs_promises_module.readdir(dirPath);
    } catch {
      // 目录不存在或无法读取,移除监视器
      if (this._removeWatcher) {
        this._removeWatcher(
          path_module.dirname(dirPath),
          path_module.basename(dirPath)
        );
      }
    }
  }

  /**
   * 检查是否包含指定项目
   */
  has(item) {
    let { items } = this;
    if (items) return items.has(item);
  }

  /**
   * 获取所有子项
   */
  getChildren() {
    let { items } = this;
    return items ? [...items.values()] : [];
  }

  /**
   * 释放资源
   */
  dispose() {
    this.items.clear();
    this.path = '';
    this._removeWatcher = EMPTY_FUNCTION;
    this.items = FROZEN_EMPTY_SET;
    Object.freeze(this);
  }
}

// CommonJS 导出
module.exports = {
  FileSystemWatcher
};

