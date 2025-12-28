'use strict';

/**
 * Command Registry - 存储已注册的 VSCode 命令
 * 用于管理和跟踪扩展中注册的所有命令的 disposable 对象
 */
const commandRegistry = new Map();

// CommonJS 导出
module.exports = {
  commandRegistry
};
