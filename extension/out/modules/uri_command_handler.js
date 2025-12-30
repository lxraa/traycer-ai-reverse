'use strict';

const vscode = require("vscode");
const { COMMAND_IDS } = require("./constants.js");
const { Logger } = require("./logger.js");

/**
 * 认证回调处理器
 * 处理来自 Traycer 平台的认证回调
 */
class AuthCallbackHandler {
  constructor(credentials) {
    this.credentials = credentials;
  }
  
  /**
   * 获取 AuthCallbackHandler 单例实例
   * @param {Object} credentials - TraycerCredentials 实例（首次调用时必需）
   * @returns {AuthCallbackHandler}
   */
  static getInstance(credentials) {
    if (!AuthCallbackHandler.instance) {
      if (!credentials) {
        throw new Error('Credentials are required');
      }
      AuthCallbackHandler.instance = new AuthCallbackHandler(credentials);
    }
    return AuthCallbackHandler.instance;
  }
  
  /**
   * 处理认证回调
   * @param {vscode.Uri} uri - 认证回调 URI
   */
  async handleAuthCallback(uri) {
    let traycerTokens = new URLSearchParams(uri.query).get('traycer-tokens');
    if (traycerTokens) {
      return this.credentials.authenticateWithTraycerToken(traycerTokens);
    }
    await vscode.window.showErrorMessage(
      'Invalid response received while authenticating with Traycer. Please try again.'
    );
  }
}

/**
 * URI 命令处理器
 * 处理通过 URI scheme 回调的命令，如打开设置、导入票据、认证回调等
 */
class UriCommandHandler {
  /**
   * 处理 URI 回调
   * @param {vscode.Uri} uri - URI 对象
   */
  async handleUri(uri) {
    // 检查 URI scheme 是否匹配
    if (uri.scheme !== vscode.env.uriScheme) {
      return;
    }
    
    // 解析命令路径和查询参数
    let commandPath = uri.path.slice(1);
    let queryParams = uri.query.split('&');
    
    switch (commandPath) {
      case COMMAND_IDS.OPEN_SETTINGS:
      case COMMAND_IDS.IMPORT_TICKET:
        await this.triggerCommand(commandPath, queryParams);
        break;
        
      case COMMAND_IDS.AUTH_CALLBACK:
        await AuthCallbackHandler.getInstance().handleAuthCallback(uri);
        break;
        
      default:
        Logger.warn('Unsupported command on URI handler: ' + commandPath);
        break;
    }
  }
  
  /**
   * 触发 VSCode 命令
   * @param {string} command - 命令 ID
   * @param {Array} args - 命令参数
   */
  async triggerCommand(command, args) {
    return vscode.commands.executeCommand(command, ...args);
  }
}

module.exports = {
  AuthCallbackHandler,
  UriCommandHandler
};

