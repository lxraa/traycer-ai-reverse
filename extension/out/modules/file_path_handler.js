'use strict';

// Node.js 内置模块
const path = require('node:path');

// 外部依赖
const { LRUMap } = require('lru_map');

// 内部模块
const { Logger } = require('./logger.js');
const { TraycerPath } = require('./path_types.js');
const { WorkspaceInfoManager } = require('./workspace_info.js');
const { TRAYCER_FILE_SCHEME } = require('./constants.js');

// 全局依赖（需要从主文件注入）
let CommentNavigator;
let PathConversionMessageTypes;
let PathConversionWebViewMessages;

/**
 * 注入依赖
 * @param {Object} deps - 依赖对象
 */
function injectFilePathHandlerDependencies(deps) {
  CommentNavigator = deps.CommentNavigator;
  PathConversionMessageTypes = deps.PathConversionMessageTypes;
  PathConversionWebViewMessages = deps.PathConversionWebViewMessages;
}

// 常量
const FILE_PATH_PATTERN_REGEX = /`file:([^`]+)`|file:([^\s),;`]+)/g;
const PATH_CACHE_SIZE = 100;

/**
 * 文件路径处理器（单例模式）
 * 用于处理文件路径转换，将相对路径转换为带有绝对路径信息的标记格式
 */
class FilePathHandler {
  constructor() {
    this.pathCache = new LRUMap(PATH_CACHE_SIZE);
  }

  /**
   * 获取单例实例
   * @returns {FilePathHandler} 单例实例
   */
  static getInstance() {
    if (!FilePathHandler.instance) {
      FilePathHandler.instance = new FilePathHandler();
    }
    return FilePathHandler.instance;
  }

  /**
   * 使指定路径的缓存失效
   * @param {string} filePath - 文件路径
   */
  async invalidatePath(filePath) {
    const traycerPath = await TraycerPath.fromPath(filePath);
    this.pathCache.delete(traycerPath.relPath);
  }

  /**
   * 清空路径缓存
   */
  clearCache() {
    this.pathCache.clear();
  }

  /**
   * 处理路径转换消息
   * @param {Object} message - 路径转换消息
   */
  async handle(message) {
    switch (message.type) {
      case PathConversionMessageTypes.CONVERT_FILE_PATH:
        await this.convertFilePathAndReturn(message);
        return;
      default:
        Logger.warn("Unknown file message type: " + message.type);
        return;
    }
  }

  /**
   * 转换文件路径并返回结果
   * @param {Object} request - 包含 requestId 和 content 的请求对象
   */
  async convertFilePathAndReturn(request) {
    const { requestId, content } = request;
    const convertedContent = await FilePathHandler.convertFilePath(content);
    const response = {
      type: PathConversionWebViewMessages.FILE_PATH_CONVERTED,
      requestId: requestId,
      convertedContent: convertedContent
    };
    return CommentNavigator.postToCommentNavigator(response);
  }

  /**
   * 转换内容中的文件路径
   * @param {string} content - 待转换的内容
   * @returns {Promise<string>} 转换后的内容
   */
  static async convertFilePath(content) {
    let result = content;
    try {
      result = await this.processFilePatterns(content, FILE_PATH_PATTERN_REGEX);
    } catch (error) {
      Logger.error("Error converting file paths in content: " + error);
      result = content;
    }
    return result;
  }

  /**
   * 处理文件路径匹配模式
   * @param {string} content - 待处理的内容
   * @param {RegExp} pattern - 匹配模式
   * @returns {Promise<string>} 处理后的内容
   */
  static async processFilePatterns(content, pattern) {
    let result = content;
    const matches = [];
    let match;
    const regex = new RegExp(pattern.source, pattern.flags);

    // 收集所有匹配项
    while ((match = regex.exec(content)) !== null) {
      const fullMatch = match[0];
      const relativePath = match[1] ?? match[2];
      if (relativePath) {
        matches.push({
          match: fullMatch,
          relativePath: relativePath,
          index: match.index
        });
      }
    }

    // 从后向前处理匹配项，避免索引偏移
    const instance = FilePathHandler.getInstance();
    for (let i = matches.length - 1; i >= 0; i--) {
      const { match: originalMatch, relativePath, index } = matches[i];
      let replacement = originalMatch;
      const normalizedPath = path.normalize(relativePath);
      
      // 检查缓存
      const cached = instance.pathCache.get(normalizedPath);
      if (cached) {
        replacement = cached.replacement;
      } else {
        // 解析文件路径
        const resolved = await FilePathHandler.resolveFilePath(relativePath);
        if (resolved) {
          replacement = resolved.replacement;
          instance.pathCache.set(normalizedPath, resolved);
        } else {
          replacement = relativePath;
        }
      }

      // 替换内容
      result = result.substring(0, index) + replacement + result.substring(index + originalMatch.length);
    }

    return result;
  }

  /**
   * 解析文件路径
   * @param {string} filePath - 文件路径（绝对路径或相对路径）
   * @returns {Promise<Object|null>} 解析结果，包含 replacement, absolutePath, isDirectory
   */
  static async resolveFilePath(filePath) {
    if (path.isAbsolute(filePath)) {
      // 处理绝对路径
      const absolutePath = filePath;
      if (await WorkspaceInfoManager.getInstance().fileExists(absolutePath)) {
        const workspace = TraycerPath.findWorkspaceForPath(absolutePath);
        let displayPath = absolutePath;
        if (workspace) {
          displayPath = path.relative(workspace, absolutePath);
        }
        const isDirectory = await WorkspaceInfoManager.getInstance().isDirectory(absolutePath);
        return {
          replacement: '<' + TRAYCER_FILE_SCHEME + ' absPath="' + absolutePath + '"' + 
                      (isDirectory ? ' isDirectory="true"' : '') + '>' + 
                      displayPath + '</' + TRAYCER_FILE_SCHEME + '>',
          absolutePath: absolutePath,
          isDirectory: isDirectory
        };
      }
    } else {
      // 处理相对路径
      const candidatePaths = [];
      const workspaceDirs = WorkspaceInfoManager.getInstance().getWorkspaceDirs();
      
      for (const workspaceDir of workspaceDirs) {
        const absolutePath = path.join(workspaceDir, filePath);
        if (await WorkspaceInfoManager.getInstance().fileExists(absolutePath)) {
          const isDirectory = await WorkspaceInfoManager.getInstance().isDirectory(absolutePath);
          candidatePaths.push({
            workspaceDir: workspaceDir,
            absolutePath: absolutePath,
            isDirectory: isDirectory
          });
        }
        if (candidatePaths.length > 1) break;
      }

      if (candidatePaths.length === 1) {
        const { absolutePath, isDirectory } = candidatePaths[0];
        return {
          replacement: '<' + TRAYCER_FILE_SCHEME + ' absPath="' + absolutePath + '"' + 
                      (isDirectory ? ' isDirectory="true"' : '') + '>' + 
                      filePath + '</' + TRAYCER_FILE_SCHEME + '>',
          absolutePath: absolutePath,
          isDirectory: isDirectory
        };
      } else if (candidatePaths.length > 1) {
        Logger.warn('FileHandler: Multiple workspace matches found for path: ' + filePath);
        return null;
      }
    }

    return null;
  }
}

module.exports = {
  FilePathHandler,
  injectFilePathHandlerDependencies,
  FILE_PATH_PATTERN_REGEX,
  PATH_CACHE_SIZE
};

