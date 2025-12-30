'use strict';

const posthog = require("posthog-js-lite");
const { config } = require("./config.js");
const { Logger } = require("./logger.js");

/**
 * PosthogAnalytics - 用于跟踪和分析用户行为的单例类
 * 
 * 功能：
 * - 初始化 PostHog 分析实例
 * - 识别用户并设置用户属性
 * - 支持隐私模式（不发送用户属性）
 * - 记录事件并附加系统标签和用户标签
 */
class PosthogAnalytics {
  constructor(userId, userEmail, privacyMode = false) {
    this.userId = userId;
    this.userEmail = userEmail;
    this.privacyMode = privacyMode;

    const apiKey = config.posthogApiKey;
    const apiUri = config.posthogApiUri;
    
    const posthogInstance = new posthog.PostHog(apiKey, {
      host: apiUri,
      flushAt: 3,
      flushInterval: 30000
    });

    posthogInstance.identify(this.userId, {
      name: this.userId || '',
      email: this.userEmail || ''
    });

    this.posthog = posthogInstance;
  }

  /**
   * 重新识别用户（当用户信息变更时调用）
   */
  reIdentify(userId, userEmail, privacyMode = false) {
    if (!userId) return;

    const userIdChanged = userId !== this.userId;
    const userEmailChanged = userEmail !== this.userEmail;

    if (!userIdChanged && !userEmailChanged) return;

    this.userId = userId;
    this.userEmail = userEmail;
    this.privacyMode = privacyMode;

    this.posthog.identify(userId, {
      name: this.userId,
      email: this.userEmail || ''
    });
  }

  /**
   * 获取单例实例
   */
  static getInstance(userId, userEmail, privacyMode = false) {
    let instance = PosthogAnalytics.instance;

    if (instance) {
      instance.reIdentify(userId, userEmail, privacyMode);
    } else {
      instance = new PosthogAnalytics(userId, userEmail, privacyMode);
      PosthogAnalytics.instance = instance;
    }

    return instance;
  }

  /**
   * 获取系统标签（版本号、用户ID等）
   */
  getSystemTags() {
    const tags = {
      defaultProperties: {
        version: config.version || "unknown"
      },
      userProperties: {}
    };

    if (this.userId) {
      tags.defaultProperties.userId = this.userId;
    }

    return tags;
  }

  /**
   * 获取所有标签（合并系统标签和用户标签）
   */
  getAllTags(customTags) {
    const systemTags = this.getSystemTags();

    return {
      ...customTags?.defaultProperties,
      ...(this.privacyMode ? {} : customTags?.userProperties),
      ...systemTags.defaultProperties,
      ...systemTags.userProperties
    };
  }

  /**
   * 记录事件
   */
  increment(eventName, customTags) {
    try {
      this.posthog.capture(eventName, this.getAllTags(customTags));
    } catch (error) {
      Logger.warn(
        "Failed to increment event: " + eventName,
        error instanceof Error ? error.message : String(error)
      );
    }
  }
}

// 静态属性初始化
PosthogAnalytics.instance = null;

module.exports = {
  PosthogAnalytics
};

