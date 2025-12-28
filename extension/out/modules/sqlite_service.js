'use strict';

const path = require("path");
const os = require("os");
const fs = require("fs/promises");
const sqlite3 = require("sqlite3");
const sqlite = require("sqlite");
const { Mutex } = require("./mutex.js");
const { cte } = require("./constants.js");

/**
 * 辅助函数：确保文件夹存在
 */
async function ensureFolderExists(folderPath, logger) {
  try {
    await fs.stat(folderPath);
  } catch (error) {
    logger.debug("Creating folder", error);
    try {
      await fs.mkdir(folderPath);
    } catch (mkdirError) {
      if (mkdirError.code !== 'EEXIST') {
        logger.warn("Error creating folder", mkdirError);
        throw mkdirError;
      }
    }
  }
}

/**
 * 辅助函数：确保输出文件夹存在
 */
async function ensureOutputFolder(logger) {
  const outputFolder = path.join(os.homedir(), ".traycer");
  await ensureFolderExists(outputFolder, logger);
  return outputFolder;
}

/**
 * 辅助函数：确保缓存文件夹存在
 */
async function ensureCacheFolder(logger) {
  const cacheFolder = path.join(await ensureOutputFolder(logger), 'cache');
  await ensureFolderExists(cacheFolder, logger);
  return cacheFolder;
}

/**
 * 辅助函数：获取缓存数据库路径
 */
async function getCacheDatabasePath(logger) {
  return path.join(await ensureCacheFolder(logger), "cache.db");
}

/**
 * 辅助函数：判断是否为数据库错误
 */
function isDatabaseError(error) {
  for (let key of cte) {
    let regex = new RegExp(key);
    if (error.message.match(regex) !== null) {
      return true;
    }
  }
  return false;
}

/**
 * SQLite 数据库服务类（单例模式）
 */
class SqliteService {
  static instance;
  dbConnection = null;
  logger;
  mutex = new Mutex();
  isShuttingDown = false;

  constructor(logger) {
    this.logger = logger;
  }

  static getInstance(logger) {
    if (!SqliteService.instance) {
      SqliteService.instance = new SqliteService(logger);
    }
    return SqliteService.instance;
  }

  async getConnection() {
    let release = await this.mutex.acquire();
    try {
      await fs.stat(await getCacheDatabasePath(this.logger));
      if (this.dbConnection) {
        return this.dbConnection;
      } else {
        this.dbConnection = await this.openConnection(this.logger);
        return this.dbConnection;
      }
    } catch (error) {
      this.logger.debug("Database file not found or connection error, creating new connection: " + error);
      this.dbConnection = await this.openConnection(this.logger);
      return this.dbConnection;
    } finally {
      release();
    }
  }

  async shutdown() {
    this.isShuttingDown = true;
    let release = await this.mutex.acquire();
    try {
      if (this.dbConnection) {
        await this.dbConnection.close();
        this.dbConnection = null;
      }
    } finally {
      release();
    }
  }

  async openConnection(logger) {
    let connection = await sqlite.open({
      filename: await getCacheDatabasePath(logger),
      driver: sqlite3.Database
    });
    await SqliteService.createTables(connection);
    return connection;
  }

  async withRecovery(callback) {
    let connection = await this.getConnection();
    try {
      return await callback(connection);
    } catch (error) {
      if (error instanceof Error && isDatabaseError(error) && !this.isShuttingDown) {
        await connection.close();
        this.dbConnection = null;
      }
      throw error;
    }
  }

  execute(query, params = []) {
    return this.withRecovery(connection => connection.run(query, params));
  }

  query(queryString, params = []) {
    return this.withRecovery(connection => connection.get(queryString, params));
  }

  static async createTables(connection) {
    await connection.exec("PRAGMA busy_timeout=10000;");
    await connection.exec('PRAGMA journal_mode=WAL;');
    await connection.exec("PRAGMA synchronous=NORMAL;");
    await connection.exec("PRAGMA cache_size=-2048;");
    await connection.exec(`
      CREATE TABLE IF NOT EXISTS summary_cache (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cacheKey TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  async getSummaryFromCache(cacheKey) {
    let result = await this.query('SELECT value, hash FROM summary_cache WHERE cacheKey = ?', [cacheKey]);
    if (result) {
      return {
        cacheKey: cacheKey,
        value: result.value,
        hash: result.hash
      };
    } else {
      this.logger.debug('No summary found for cacheKey: ' + cacheKey);
      return null;
    }
  }

  async setSummaryToCache(cacheKey, value, hash) {
    await this.execute(
      `INSERT INTO summary_cache (cacheKey, value, hash) VALUES (?, ?, ?)
       ON CONFLICT(cacheKey) DO UPDATE SET value = excluded.value, hash = excluded.hash`,
      [cacheKey, value, hash]
    );
  }

  async invalidateCache(cacheKey) {
    await this.execute("DELETE FROM summary_cache WHERE cacheKey = ?", [cacheKey]);
  }
}

/**
 * 摘要缓存服务类
 */
class SummaryCacheService {
  dbService;

  constructor(dbService) {
    this.dbService = dbService;
  }

  async shutdown() {
    await this.dbService.shutdown();
  }

  async getSummaryFromCache(cacheKey, content) {
    let cached = await this.dbService.getSummaryFromCache(cacheKey);
    if (cached) {
      let contentHash = await SummaryCacheService.calculateHashAsync(content);
      if (contentHash === cached.hash) {
        return cached.value;
      }
      await this.dbService.invalidateCache(cacheKey);
    }
    return '';
  }

  async setSummaryToCache(cacheKey, value, content, extraParam) {
    let hash = await SummaryCacheService.calculateHashAsync(content);
    await this.dbService.setSummaryToCache(cacheKey, value, hash, extraParam);
  }

  static async calculateHashAsync(content) {
    const crypto = require("node:crypto");
    let encoded = new TextEncoder().encode(content);
    let hashBuffer = await crypto.webcrypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(hashBuffer))
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }
}

module.exports = {
  SqliteService,
  SummaryCacheService
};

