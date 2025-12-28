'use strict';

const { Logger } = require("./logger.js");

/**
 * Memento 键名枚举
 * 用于标识不同类型的持久化数据
 */
const MementoKey = {
  AnalysisHistory: "traycerAnalysisHistory",
  TaskHistory: "traycerTaskHistory"
};

/**
 * Memento 键到数据库表名的映射
 */
const MementoToTableMapping = {
  traycerAnalysisHistory: 'AnalysisHistory',
  traycerTaskHistory: 'TaskHistory'
};

/**
 * SQLite 迁移器
 * 负责将 VSCode Memento 中的数据迁移到 SQLite 数据库
 */
class SqliteMigrator {
  /**
   * 将所有 Memento 数据迁移到 SQLite
   * @param {vscode.ExtensionContext} context - VSCode 扩展上下文
   * @param {SqliteService} sqliteService - SQLite 服务实例
   */
  static async migrateToSqlite(context, sqliteService) {
    for (let key of Object.values(MementoKey)) {
      let mementoData = context.globalState.get(key);
      
      if (!mementoData) {
        continue;
      }
      
      let version = mementoData.version;
      await this.processMigration(key, version, mementoData, sqliteService);
      
      // 迁移完成后清除 Memento 中的数据
      await context.globalState.update(key, void 0);
    }
  }

  /**
   * 处理单个 Memento 的迁移
   * @param {string} mementoKey - Memento 键名
   * @param {number} version - 数据版本
   * @param {Object} mementoData - Memento 数据对象
   * @param {SqliteService} sqliteService - SQLite 服务实例
   */
  static async processMigration(mementoKey, version, mementoData, sqliteService) {
    let tableName = MementoToTableMapping[mementoKey];
    
    // 获取写锁并开始事务
    await sqliteService.acquireWriteLock();
    await sqliteService.beginTransaction();
    
    let isSuccess = false;
    let records = Object.entries(mementoData.records);
    
    Logger.debug(
      'Migrating ' + records.length + 
      " records from memento " + mementoKey + 
      " to " + tableName
    );
    
    let upsertPromises = [];
    
    try {
      for (let [, recordData] of records) {
        let {
          lastUpdated,
          object: dataObject
        } = recordData;
        
        let metadata = {
          version: version,
          lastUpdated: lastUpdated
        };
        
        let upsertPromise = sqliteService.upsert(tableName, dataObject, metadata);
        upsertPromises.push(upsertPromise);
      }
      
      await Promise.all(upsertPromises);
      isSuccess = true;
    } finally {
      // 根据迁移结果提交或回滚事务
      if (isSuccess) {
        await sqliteService.commitTransaction();
      } else {
        await sqliteService.rollbackTransaction();
      }
      
      await sqliteService.releaseWriteLock();
    }
  }
}

// CommonJS 导出
module.exports = {
  SqliteMigrator,
  MementoKey,
  MementoToTableMapping
};

