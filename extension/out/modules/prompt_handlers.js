'use strict';

const vscode = require("vscode");
const { Logger } = require("./logger.js");

/**
 * ExtensionHelper - 用于获取和激活 VSCode 扩展的辅助类
 */
class ExtensionHelper {
  /**
   * 获取指定的 VSCode 扩展
   * @param {string} extensionId - 扩展 ID
   * @param {string} displayName - 显示名称
   * @param {string} extensionName - 扩展名称（可选，默认使用 displayName）
   * @returns {Promise<vscode.Extension>} - VSCode 扩展实例
   */
  static async getExtension(extensionId, displayName, extensionName) {
    let extension = vscode.extensions.getExtension(extensionId);
    if (!extension) {
      Logger.warn("Extension not found", extensionId);
      const result = await vscode.window.showInformationMessage(
        `You have selected to use ${displayName} for execution, but the ${extensionName ?? displayName} extension is not installed. Would you like to install it from the marketplace?`,
        "View in Marketplace",
        'Cancel'
      );
      if (result === "View in Marketplace") {
        Logger.info('Opening marketplace for extension', extensionId);
        await vscode.commands.executeCommand("workbench.extensions.search", extensionId);
      }
      throw new Error(`${displayName} extension not found`);
    }
    return extension;
  }

  /**
   * 激活指定的 VSCode 扩展
   * @param {string} extensionId - 扩展 ID
   * @param {string} displayName - 显示名称
   * @param {string} extensionName - 扩展名称（可选）
   * @returns {Promise<vscode.Extension>} - 已激活的 VSCode 扩展实例
   */
  static async activateExtension(extensionId, displayName, extensionName) {
    let extension = await ExtensionHelper.getExtension(extensionId, displayName, extensionName);
    await extension.activate();
    return extension;
  }
}

/**
 * ExtensionTaskHandler - 扩展任务处理基类
 * 用于处理需要调用其他扩展的任务
 * 
 * 注意：此类需要在运行时与 BasePromptTemplate 建立继承关系
 * 通过 createPromptHandlerClasses 工厂函数实现动态继承
 */
class ExtensionTaskHandler {
  constructor(prompt, config) {
    this.prompt = prompt;
    this.config = config;
  }

  async handle() {
    let extension = await ExtensionHelper.getExtension(
      this.config.extensionId,
      this.config.displayName,
      this.config.extensionName
    );
    await this.startTask(extension.exports);
    if (this.config.sidebarCommand) {
      await vscode.commands.executeCommand(this.config.sidebarCommand);
    }
  }
}

/**
 * ClipboardPromptHandler - 剪贴板提示处理基类
 * 通过剪贴板操作来传递提示内容
 * 
 * 注意：此类需要在运行时与 BasePromptTemplate 建立继承关系
 * 通过 createPromptHandlerClasses 工厂函数实现动态继承
 */
class ClipboardPromptHandler {
  constructor(prompt) {
    this.prompt = prompt;
    this.customDelay = 100;
  }

  getPreCommandsToRun() {
    return [];
  }

  async handle() {
    let originalClipboard = await vscode.env.clipboard.readText();
    
    // 执行预命令
    for (let command of this.getPreCommandsToRun()) {
      await vscode.commands.executeCommand(command);
      await new Promise(resolve => setTimeout(resolve, this.customDelay));
    }
    
    // 写入提示到剪贴板并粘贴
    await vscode.env.clipboard.writeText(this.prompt);
    await vscode.commands.executeCommand("editor.action.clipboardPasteAction");
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // 恢复原剪贴板内容
    await vscode.env.clipboard.writeText(originalClipboard);
  }
}

// ============== 基于 ExtensionTaskHandler 的具体实现 ==============

/**
 * ClineHandler (Windsurf) - 处理 Cline 扩展任务
 */
class ClineHandler extends ExtensionTaskHandler {
  constructor(prompt) {
    super(prompt, {
      extensionId: 'saoudrizwan.claude-dev',
      displayName: 'Cline',
      sidebarCommand: 'claude-dev.SidebarProvider.focus'
    });
  }

  async startTask(extensionExports) {
    await extensionExports.startNewTask(this.prompt);
  }
}

/**
 * KiloCodeHandler (Cursor) - 处理 Kilo Code 扩展任务
 */
class KiloCodeHandler extends ExtensionTaskHandler {
  constructor(prompt) {
    super(prompt, {
      extensionId: "kilocode.Kilo-Code",
      displayName: "Kilo Code",
      extensionName: 'Kilo Code',
      sidebarCommand: "kilo-code.SidebarProvider.focus"
    });
  }

  async startTask(extensionExports) {
    await extensionExports.startNewTask({
      configuration: {},
      text: this.prompt
    });
  }
}

/**
 * RooCodeHandler (Zed) - 处理 Roo Code 扩展任务
 */
class RooCodeHandler extends ExtensionTaskHandler {
  constructor(prompt) {
    super(prompt, {
      extensionId: "RooVeterinaryInc.roo-cline",
      displayName: 'Roo Code',
      extensionName: "Roo Code",
      sidebarCommand: "roo-cline.SidebarProvider.focus"
    });
  }

  async startTask(extensionExports) {
    await extensionExports.startNewTask({
      configuration: {},
      text: this.prompt
    });
  }
}

// ============== 基于 ClipboardPromptHandler 的具体实现 ==============

/**
 * AmpHandler (Cline) - 处理 Amp 扩展任务
 */
class AmpHandler extends ClipboardPromptHandler {
  constructor(prompt) {
    super(prompt);
    this.customDelay = 400;
    this.config = {
      extensionId: 'sourcegraph.amp',
      displayName: 'Amp',
      extensionName: 'Amp'
    };
  }

  getPreCommandsToRun() {
    return ["amp.agent.newThread"];
  }

  async handle() {
    await ExtensionHelper.getExtension(
      this.config.extensionId,
      this.config.displayName,
      this.config.extensionName
    );
    return super.handle();
  }
}

/**
 * AugmentHandler (Aider) - 处理 Augment 扩展任务
 */
class AugmentHandler extends ClipboardPromptHandler {
  constructor(prompt) {
    super(prompt);
    this.config = {
      extensionId: "augment.vscode-augment",
      displayName: "Augment",
      extensionName: "Augment"
    };
  }

  getPreCommandsToRun() {
    return ["vscode-augment.startNewChat"];
  }

  async handle() {
    await ExtensionHelper.activateExtension(
      this.config.extensionId,
      this.config.displayName,
      this.config.extensionName
    );
    return super.handle();
  }
}

/**
 * ClaudeCodeHandler (Copilot) - 处理 Claude Code 扩展任务
 */
class ClaudeCodeHandler extends ClipboardPromptHandler {
  constructor(prompt) {
    super(prompt);
    this.customDelay = 2000;
    this.config = {
      extensionId: 'anthropic.claude-code',
      displayName: 'Claude Code Extension',
      extensionName: "Claude Code"
    };
  }

  getPreCommandsToRun() {
    return ["claude-vscode.editor.open"];
  }

  async handle() {
    await ExtensionHelper.getExtension(
      this.config.extensionId,
      this.config.displayName,
      this.config.extensionName
    );
    return super.handle();
  }
}

/**
 * ChatGPTHandler (Continue) - 处理 ChatGPT/Codex 扩展任务
 */
class ChatGPTHandler extends ClipboardPromptHandler {
  constructor(prompt) {
    super(prompt);
    this.customDelay = 2000;
    this.config = {
      extensionId: "openai.chatgpt",
      displayName: 'Codex Extension',
      extensionName: "Codex"
    };
  }

  getPreCommandsToRun() {
    return ['chatgpt.newCodexPanel'];
  }

  async handle() {
    await ExtensionHelper.getExtension(
      this.config.extensionId,
      this.config.displayName,
      this.config.extensionName
    );
    return super.handle();
  }
}

/**
 * ZenCoderHandler (Roo) - 处理 ZenCoder 扩展任务
 */
class ZenCoderHandler extends ClipboardPromptHandler {
  constructor(prompt) {
    super(prompt);
    this.customDelay = 400;
    this.config = {
      extensionId: "zencoderai.zencoder",
      displayName: "ZenCoder",
      extensionName: 'ZenCoder'
    };
  }

  getPreCommandsToRun() {
    return ["zencoder.insert-into-chat"];
  }

  async handle() {
    await ExtensionHelper.getExtension(
      this.config.extensionId,
      this.config.displayName,
      this.config.extensionName
    );
    return super.handle();
  }
}

// ============== 独立的 Handler 类（直接继承 ClipboardPromptHandler）==============

/**
 * CopilotPromptHandler - 处理 GitHub Copilot Chat
 */
class CopilotPromptHandler extends ClipboardPromptHandler {
  getPreCommandsToRun() {
    return [];
  }

  async handle() {
    await vscode.commands.executeCommand("workbench.action.chat.open", {
      mode: 'agent',
      query: this.prompt,
      isPartialQuery: false
    });
  }
}

/**
 * CursorPromptHandler - 处理 Cursor 编辑器
 */
class CursorPromptHandler extends ClipboardPromptHandler {
  getPreCommandsToRun() {
    return ["composer.createNewComposerTab", "composerMode.agent", "aichat.newfollowupaction"];
  }
}

/**
 * AugmentPromptHandler - 处理 Augment 原生集成
 */
class AugmentPromptHandler extends ClipboardPromptHandler {
  getPreCommandsToRun() {
    return [
      'workbench.action.chat.icube.open',
      "workbench.action.icube.aiChatSidebar.createNewSession",
      "workbench.panel.chat.view.ai-chat.focus"
    ];
  }
}

/**
 * WindsurfPromptHandler - 处理 Windsurf 编辑器（Cascade）
 */
class WindsurfPromptHandler extends ClipboardPromptHandler {
  getPreCommandsToRun() {
    return ['windsurf.prioritized.chat.openNewConversation'];
  }

  async handle() {
    for (let command of this.getPreCommandsToRun()) {
      await vscode.commands.executeCommand(command);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    await vscode.env.clipboard.writeText(this.prompt);
    vscode.window.showInformationMessage(
      "Prompt copied to clipboard. Paste it into Cascade to start the execution."
    );
  }
}

/**
 * AntigravityPromptHandler - 处理 Antigravity 编辑器
 */
class AntigravityPromptHandler extends ClipboardPromptHandler {
  getPreCommandsToRun() {
    return [
      'antigravity.prioritized.chat.open',
      'antigravity.prioritized.chat.openNewConversation'
    ];
  }
}

// CommonJS 导出
module.exports = {
  // 基础类
  ExtensionHelper,
  ExtensionTaskHandler,
  ClipboardPromptHandler,
  
  // ExtensionTaskHandler 子类
  ClineHandler,
  KiloCodeHandler,
  RooCodeHandler,
  
  // ClipboardPromptHandler 子类（需要扩展检测）
  AmpHandler,
  AugmentHandler,
  ClaudeCodeHandler,
  ChatGPTHandler,
  ZenCoderHandler,
  
  // ClipboardPromptHandler 子类（独立）
  CopilotPromptHandler,
  CursorPromptHandler,
  AugmentPromptHandler,
  WindsurfPromptHandler,
  AntigravityPromptHandler
};

