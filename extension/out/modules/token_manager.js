'use strict';

// 导入依赖
const { Logger } = require("./logger.js");
const { config } = require("./config.js");
const { 
  UnauthorizedError, 
  NetworkError, 
  RetryExecutor 
} = require("./retry_executor.js");

/**
 * 获取 Google IAP Token
 * @returns {Promise<string|null>} IAP Token 或 null
 */
async function fetchGoogleIapToken() {
  let targetAudience = config.iapTargetAudience;
  
  if (!targetAudience?.trim()) {
    Logger.warn("No target audience provided");
    return null;
  }
  
  try {
    let { GoogleAuth } = await import("google-auth-library");
    let auth = new GoogleAuth();
    
    if (!auth?.fetchIdToken) {
      Logger.warn(
        "Cannot fetch ID token in this environment",
        "Use GCE or set the GOOGLE_APPLICATION_CREDENTIALS environment variable to a service account credentials JSON file"
      );
      return null;
    }
    
    let token = await auth.fetchIdToken(targetAudience).catch(error => {
      Logger.warn('Failed to fetch IAP token', error);
      return null;
    });
    
    Logger.debug("Fetched IAP token");
    return token;
  } catch (error) {
    Logger.warn("Failed to get IAP token", error);
    return null;
  }
}

/**
 * Token 管理器 - 处理 token 的验证、刷新、交换等操作
 */
class TokenManager {
  constructor(authClient) {
    this.authClient = authClient;
  }

  /**
   * 验证 Token
   */
  async validateToken(token, signal) {
    return await RetryExecutor.executeTokenValidation(async () => {
      let headers = await this.prepareHeaders(token);
      let response = await this.authClient.getUser(headers);
      
      if (response.status === 404 || response.status === 401) {
        throw new UnauthorizedError('Failed to validate token: ' + response.status);
      }
      if (!response.ok) {
        throw new NetworkError('Failed to validate token: ' + response.status);
      }
      
      return await response.json();
    }, signal);
  }

  /**
   * 验证发票
   */
  async validateInvoice(token) {
    let headers = await this.prepareHeaders(token);
    let response = await this.authClient.validateInvoice(headers);
    
    if (response.status === 401) {
      throw new UnauthorizedError();
    }
    if (!response.ok) {
      throw new NetworkError("Failed to validate invoice: " + response.status);
    }
    
    return await response.json();
  }

  /**
   * 刷新 Token
   */
  async refreshToken(token, signal) {
    return await RetryExecutor.executeTokenValidation(async () => {
      let headers = await this.prepareHeaders(token);
      let response = await this.authClient.refreshToken(headers);
      
      if (response.status === 401) {
        throw new UnauthorizedError("Failed to refresh token: " + response.status);
      }
      if (!response.ok) {
        throw new NetworkError('Failed to refresh token: ' + response.status);
      }
      
      return await response.json();
    }, signal);
  }

  /**
   * 交换 Token
   */
  async exchangeToken(token, signal) {
    return await RetryExecutor.executeTokenValidation(async () => {
      let headers = await this.prepareHeaders(token);
      let response = await this.authClient.exchangeToken(headers);
      
      if (response.status === 401) {
        throw new UnauthorizedError("Failed to exchange token: " + response.status);
      }
      if (!response.ok) {
        throw new NetworkError('Failed to exchange token: ' + response.status);
      }
      
      return await response.json();
    }, signal);
  }

  /**
   * 列出所有 MCP 服务器
   */
  async listAllMCPServers(token) {
    let headers = await this.prepareHeaders(token);
    let response = await this.authClient.listAllMCPServers(headers);
    
    if (response.status === 401) {
      throw new UnauthorizedError();
    }
    if (!response.ok) {
      throw new NetworkError("Failed to list MCP servers: " + response.status);
    }
    
    return await response.json();
  }

  /**
   * 准备请求头
   */
  async prepareHeaders(token) {
    let iapToken = null;
    
    // 开发环境下获取 IAP token
    if (config.nodeEnv === 'development') {
      iapToken = await fetchGoogleIapToken().catch(error => {
        Logger.warn("Failed to get IAP token for validation", error);
        return null;
      });
      
      if (!iapToken) {
        Logger.warn('IAP token not received for validation');
        throw new Error('Failed to get IAP token for validation');
      }
    }
    
    let headers = new Headers();
    if (iapToken) {
      headers.set("Proxy-Authorization", 'Bearer ' + iapToken);
    }
    headers.set("Authorization", 'Bearer ' + token);
    
    return headers;
  }
}

// 导出
module.exports = {
  TokenManager,
  fetchGoogleIapToken
};

