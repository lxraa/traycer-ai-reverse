'use strict';

const { Logger } = require("./logger.js");
const { SqliteService, SummaryCacheService } = require("./sqlite_service.js");
const { WorkspaceInfoManager, DocumentManager } = require("./workspace_info.js");
const { TraycerPath } = require("./path_types.js");

/**
 * LLM 缓存处理器
 * 
 * 单例模式，用于管理文件摘要的缓存存取。
 * 依赖 SqliteService 和 SummaryCacheService 进行实际的数据库操作。
 */
class LlmCacheHandler {
  constructor(llmCache) {
    this.llmCache = llmCache;
  }

  /**
   * 获取 LlmCacheHandler 单例实例
   * @returns {Promise<LlmCacheHandler>}
   */
  static async getInstance() {
    if (!LlmCacheHandler.instance) {
      let workspaceInfo = WorkspaceInfoManager.getInstance();
      let sqliteService = SqliteService.getInstance(workspaceInfo.getLogger());
      let summaryCacheService = new SummaryCacheService(sqliteService);
      
      LlmCacheHandler.instance = new LlmCacheHandler(summaryCacheService);
    }
    return LlmCacheHandler.instance;
  }

  /**
   * 关闭缓存处理器
   */
  shutdown() {
    this.runShutdownInBackground();
  }

  /**
   * 在后台运行关闭流程
   */
  async runShutdownInBackground() {
    try {
      await this.llmCache.shutdown();
      LlmCacheHandler.instance = null;
    } catch (error) {
      Logger.error(error, 'Failed to shutdown cache handler');
    }
  }

  /**
   * 从缓存中获取文件摘要
   * @param {string} filePath - 文件路径
   * @param {*} additionalParam - 额外参数
   * @returns {Promise<string>} 摘要内容
   */
  async getSummaryFromCache(filePath, additionalParam) {
    try {
      return await this.llmCache.getSummaryFromCache(filePath, additionalParam);
    } catch (error) {
      Logger.error('Error getting summary from cache for ' + filePath, error);
      return '';
    }
  }

  /**
   * 将文件摘要保存到缓存
   * @param {*} pathProto - 路径 proto 对象
   * @param {string} summary - 摘要内容
   */
  async setSummaryToCache(pathProto, summary) {
    try {
      let absPath = TraycerPath.fromPathProto(pathProto).absPath;
      let sourceCode = await DocumentManager.getSourceCode(absPath);
      await this.llmCache.setSummaryToCache(absPath, summary, sourceCode, null);
    } catch (error) {
      Logger.error("Error setting summary to cache for " + pathProto, error);
    }
  }
}

module.exports = {
  LlmCacheHandler
};

